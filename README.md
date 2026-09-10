# Echo

> A quiet companion for your loudest thoughts.

A mobile journalling application providing structured emotional support through
guided journal entries, crisis-aware safeguards, and an AI reflection layer.
Built as a final year project against SRS-ESC-001 v0.9.

* [Status](#status)
* [Quick start](#quick-start)
* [Safety constraints](#safety-constraints)
* [Architecture](#architecture)
* [Project layout](#project-layout)
* [Testing](#testing)
* [Database migrations](#database-migrations)
* [Known gaps](#known-gaps)

---

## Status

| # | Module | SRS | Backend | Frontend |
| --- | --- | --- | --- | --- |
| 1 | Authentication (account layer) | 4.2 | Complete | Complete |
| 2 | Application lock (device layer) | 4.2 | Not applicable | Not started |
| 3 | Onboarding | 4.3 | Complete | Mostly complete |
| 4 | Dashboard and engagement | 4.4 | Not started | Not started |
| 5 | Entry engine | 4.5 | Not started | Not started |
| 6 | Journal types | 4.6 | Not started | Not started |
| 7 | Selection libraries | 4.7 | Not started | Not started |
| 8 | Crisis detection and response | 4.8 | Not started | Not started |
| 9 | AI reflection module | 4.9 | Not started | Not started |
| 10 | Insights | 4.10 | Not started | Not started |
| 11 | Learning library | 4.11 | Not started | Not started |
| 12 | User data control | 4.12 | Not started | Not started |

The application lock has no backend component by design: FR-AUTH-009 requires the
lock secret never to be transmitted, so it is device-resident.

### What works today

**Authentication.** Registration, sign-in, short-lived access tokens with
rotating refresh tokens and family revocation on reuse, rate limiting, email
verification, password reset, and new-device notification. Fifteen endpoints, all
exercised by an automated Postman collection.

**Onboarding.** Consent with version tracking, focus area selection validated
against a content set, distress baseline, weekly goal, and a status endpoint that
lets an interrupted sequence resume at the right step.

**Client.** Welcome, sign-up, sign-in, forgot-password, consent, focus areas,
distress, weekly goal, and a placeholder home screen — all talking to the live
API.

---

## Quick start

Three processes run during development: the API, the Metro bundler, and an
Android emulator or device.

### Backend

```bash
cd emotional-support-backend

python -m venv venv
venv\Scripts\activate          # Windows
source venv/bin/activate       # macOS / Linux

pip install -r requirements.txt
# create .env — see below
alembic upgrade head
uvicorn app.main:app --reload
```

API at `http://127.0.0.1:8000`, interactive docs at `/docs`.

**`.env`** (git-ignored, never commit):

```
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=<python -c "import secrets; print(secrets.token_urlsafe(32))">
RESEND_API_KEY=re_...
```

Optional, defaults shown:

```
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=30
CONSENT_VERSION=v1
EMAIL_FROM=onboarding@resend.dev
APP_BASE_URL=http://127.0.0.1:8000
```

### Client

```bash
cd EmotionalSupportApp

npm install
npx react-native start        # leave running

# in a second terminal
npx react-native run-android
```

The client reaches the API at `http://10.0.2.2:8000` — the Android emulator's
alias for the host machine. `127.0.0.1` inside an emulator means the emulator
itself. The address is set in one place, `src/api/client.ts`.

### Environment requirements

Worth stating explicitly, because these caused most of the setup time on this
project:

- **64-bit JDK 17.** A 32-bit JVM cannot reserve the heap Gradle requests, and
  the Kotlin plugin refuses to run at all, reporting `Unknown hardware platform:
  x86`. Check with `java -XshowSettings:properties -version`; `os.arch` must read
  `amd64`.
- **Android NDK 27.1.12297006**, installed through Android Studio's SDK Manager.
- **Node must be allowed through the firewall.** Windows Defender blocks Node
  from accepting connections by default, which leaves the client unable to reach
  Metro with no useful error.
- `android/gradle.properties` sets `reactNativeArchitectures=x86_64` to shorten
  emulator builds. **Restore the full list before building for a device or for
  release.**

---

## Safety constraints

These are requirements of the product, not implementation details, and they
constrain how features may be built.

**Emails reveal nothing about the application's purpose.** Verification, reset
and new-device messages mention no journalling, mental health, or app name.
Someone else seeing the recipient's inbox learns only that an account exists.
This is FR-AUTH-016's explicit requirement and is applied to every message.

**Sign-in failures are indistinguishable.** An unregistered email and a wrong
password return identical bodies, status codes and content lengths. Without this,
anyone could probe addresses to discover who uses the application. The same
discretion applies to `/auth/forgot-password`, which responds identically whether
or not the address is registered — and the client's wording preserves it.

**The device lock secret never leaves the device.** FR-AUTH-009. No endpoint
accepts a PIN or pattern; building one would violate the requirement.

**Identifiers are not enumerable.** UUID primary keys throughout, so no record ID
reveals how many users exist or allows guessing at a neighbour's.

**Only what is needed is collected.** `known_devices` stores a fingerprint and
timestamps — no IP address, user agent or location. Email send failures are
swallowed rather than logged, because a recipient address in an error log is
itself a record that someone uses a mental health application.

**Credentials are stored as hashes, never plaintext.** Passwords with bcrypt;
refresh and verification tokens with SHA-256. A leaked database yields no usable
credentials.

**Clinical wording is reviewable without reading code.** Distress descriptions and
focus area labels live in `app/content/*.json`, loaded at startup, so a clinical
advisor can review and revise them directly.

**Focus areas are labelled non-clinically.** FR-ONB-005. Codes are neutral
identifiers; display wording avoids diagnostic terms. This remains a judgement
call worth reviewing — see Known gaps.

**Verification never blocks use.** FR-AUTH-003. An unverified account has full
access. Requiring verification would lock out anyone who mistyped an address or
whose mail was delayed.

---

## Architecture

```
React Native client
        │  HTTPS, Authorization: Bearer <access token>
        ▼
FastAPI  ──  routers → schemas (validate) → models → SQLAlchemy
        │                    │
        │                    └── core: config, security, tokens, email, rate limit
        ▼
PostgreSQL 17 on Supabase (ap-south-1, session pooler)
```

| Layer | Choice | Notes |
| --- | --- | --- |
| Client | React Native 0.87 (CLI) | TypeScript; not Expo |
| API | FastAPI on Uvicorn | OpenAPI docs generated at `/docs` |
| ORM | SQLAlchemy 2.0 | |
| Migrations | Alembic | |
| Database | PostgreSQL 17, Supabase-hosted | Data API disabled |
| Password hashing | bcrypt | Used directly, not through passlib |
| Tokens | python-jose, HS256 | |
| Email | Resend | |

**Supabase provides hosted PostgreSQL only.** Authentication is implemented in
FastAPI as the SRS specifies. Supabase Auth is not used, and the Supabase Data
API is switched off, so the database is reachable only through this backend and
never directly from a client.

**Authentication is a dependency, not per-endpoint code.** `get_current_user`
extracts and verifies the bearer token and returns the account. Every protected
endpoint declares it as a parameter, so the check cannot be forgotten on a new
endpoint.

**Models and schemas are separate on purpose.** Models describe what the database
stores; schemas describe what the API accepts and returns. `password_hash` exists
on the `Account` model and in no response schema, so it cannot reach a client even
by mistake.

**Refresh token rotation with family revocation.** Each refresh token works once.
Presenting a consumed token means two parties hold it, so the entire family
descended from that sign-in is revoked. Theft announces itself instead of
granting a month of silent access.

**Connection pooling.** `pool_pre_ping` and `pool_recycle` are set on the engine.
Supabase's pooler closes idle connections, and without pre-ping SQLAlchemy hands
out a dead one after a quiet period — surfacing as
`server closed the connection unexpectedly` at exactly the wrong moment.

---

## Project layout

```
EmotionalSupport/
├── emotional-support-backend/
│   ├── app/
│   │   ├── content/          Clinical and configurable content as JSON
│   │   │   ├── distress_scale.json     Descriptions for values 0–10
│   │   │   └── focus_areas.json        Codes and display labels
│   │   ├── core/
│   │   │   ├── config.py               Settings from .env
│   │   │   ├── database.py             Engine, session, get_db dependency
│   │   │   ├── dependencies.py         get_current_user
│   │   │   ├── security.py             Hashing, JWT, token generation
│   │   │   ├── tokens.py               Issue, rotate, revoke refresh tokens
│   │   │   ├── verification.py         Email verification and reset tokens
│   │   │   ├── devices.py              New-device detection and notification
│   │   │   ├── email.py                Resend wrapper
│   │   │   └── rate_limit.py           Failed sign-in counting
│   │   ├── models/           accounts, focus_areas, refresh_tokens,
│   │   │                     verification_tokens, known_devices
│   │   ├── routers/          auth.py, onboarding.py, health.py
│   │   ├── schemas/          account.py, onboarding.py
│   │   └── main.py
│   ├── alembic/versions/     Seven migrations, applied in sequence
│   ├── .env                  Secrets — git-ignored
│   └── requirements.txt
│
└── EmotionalSupportApp/
    ├── App.tsx               Screen routing and resume logic
    └── src/
        ├── api/
        │   ├── client.ts     Single request helper; API base URL lives here
        │   └── auth.ts       signup, login, getMe
        ├── components/
        │   ├── PrimaryButton.tsx
        │   └── Field.tsx
        ├── screens/          Welcome, Signup, Login, ForgotPassword,
        │                     Consent, FocusAreas, Distress, Goal, Home
        ├── storage/
        │   └── tokens.ts     Token persistence
        └── theme.ts          Colours, type scale, spacing, radii
```

### Design system

The client's visual direction is sage and eucalyptus greens on a warm off-white,
with botanical line art, generous spacing and sentence-case copy that avoids
clinical language. Every colour and size lives in `src/theme.ts`, so the palette
changes in one place.

Headings currently use the platform serif. A custom typeface would need native
font linking and a rebuild; because typography is confined to `theme.ts`, that
remains a contained change.

---

## Testing

### API

`emotional-support-api-full.postman_collection.json` covers every endpoint,
each failure mode, boundary values, and account isolation between users.

Import it into Postman, then **Run collection**. Tokens are captured
automatically into collection variables and a fresh test email is generated each
run, so the suite is repeatable.

Two things to know:

- Requests marked **MANUAL** cannot be asserted automatically — they depend on an
  email arriving or a link being opened. Their assertions check the API response
  only; the manual steps are listed in each request's test script.
- The **rate-limiting folder locks its account for fifteen minutes.** Run it last,
  or restart the server afterwards to clear the in-memory counter.

Coverage includes: registration and duplicate rejection, password length
boundaries, malformed input, sign-in success and both failure modes with
byte-identical responses, missing and tampered tokens, refresh rotation and
family revocation, invented and replayed tokens, all onboarding endpoints with
boundary and out-of-range values, focus area validation, and a check that a second
account sees none of the first account's data.

### Client

Manual, on the emulator. The flow worth walking end to end:

1. Welcome → create an account with a fresh address
2. Consent → focus areas → distress → weekly goal → home
3. Sign out, sign back in — should land on home, not onboarding
4. Wrong password — should show the backend's message, unchanged
5. Duplicate email — should show the 409 message
6. Force-quit and reopen — should go straight to home, proving token persistence
7. Quit midway through onboarding and reopen — should resume at the step reached

Step 7 exercises FR-ONB-010 and is easy to break when routing changes.

No automated test suite runs in CI.

---

## Database migrations

```bash
# after changing a model
alembic revision --autogenerate -m "description of the change"

# read the generated file in alembic/versions/, then
alembic upgrade head

# roll back one migration
alembic downgrade -1
```

**Read a generated migration before applying it.** Autogenerate is reliable but
not infallible, and a migration that drops a table is not recoverable.

Every new model needs a line in `app/models/__init__.py`. Alembic discovers
tables through `Base.metadata`, and a model only registers there once Python has
imported it — a missing import produces a silently empty migration.

### Tables

| Table | Purpose |
| --- | --- |
| `accounts` | Credentials, onboarding responses, preferences |
| `focus_areas` | Focus area selections, one row per selection |
| `refresh_tokens` | Hashed refresh tokens with family and revocation state |
| `verification_tokens` | Hashed single-use tokens for verification and reset |
| `known_devices` | Device fingerprints seen per account |
| `alembic_version` | Current migration state |

Foreign keys to `accounts` cascade on delete, so removing an account removes its
dependent rows — required for the data control module in SRS 4.12.

---

## Known gaps

Ordered roughly by how much they matter. Reasoning for each is in
[DEVELOPMENT-LOG.md](DEVELOPMENT-LOG.md).

### Needs attention before a demo

**Elevated distress is not handled.** FR-ONB-007 requires a support screen when
someone selects 9 or 10 on the distress scale. Those values currently save like
any other and the flow continues to the next step. This is the most significant
gap in the application: someone reporting severe distress before writing anything
should see crisis resources, not a Continue button. Implementing it requires
verified helpline numbers for Pakistan.

**Distress scale wording is provisional.** FR-ONB-006 names the Clinical Advisor
as the source for the eleven descriptions. The current text is placeholder and
requires review.

**Tokens are stored unencrypted on the device.** `src/storage/tokens.ts` uses
AsyncStorage, which is plain text. Tokens are credentials, and this application
holds mental health data; secure device storage (Android Keystore, via
`react-native-keychain` or equivalent) is required before real use.

**Email delivery is restricted to one address.** Without a verified sending
domain, Resend delivers only to the account holder's own address. Nobody else can
register and receive a verification or reset email until a domain is verified.

**Focus area labels remain a judgement call.** FR-ONB-005 requires non-clinical
labelling. The current labels are gentler than diagnostic terms but some sit close
to clinical language, and the design and backend content sets have diverged. Both
need reconciling and reviewing.

### Functional gaps

**Password reset cannot be completed in the app.** Both endpoints work and are
tested, but the reset link opens a browser and hits a POST-only endpoint. Two
routes forward: deep linking so the link opens the app with its token, or
switching both flows to typed codes. Codes suit a mobile-only application better
and remove the deep-linking work; links are what the SRS specifies.

**No resend option for verification.** If an address was mistyped, there is no
way to correct it and request a new link.

**Application lock not built.** Nine requirements, entirely client-side. The SRS
schedules enrolment after the first completed journal entry, so it depends on the
entry engine.

**Logout is client-side only.** The client discards its tokens; the access token
remains valid until it expires. Refresh tokens are revocable server-side.

### Infrastructure and hygiene

**Rate limiting is per-process.** Failure counts live in application memory and
reset on restart. A production deployment needs a shared store such as Redis.

**Placeholder icons.** The circular sage shapes in the client stand in for the
icons in the design. An icon library is needed.

**Unused permission in the manifest.** `AndroidManifest.xml` requests nearby
devices, inherited from the React Native template. It should be removed: for an
application holding mental health data, requesting permissions that are never used
is both a privacy problem and something a reviewer will ask about.

**Build architecture is narrowed for the emulator.**
`reactNativeArchitectures=x86_64` in `android/gradle.properties` must be restored
to the full list before building for a device or for release.

**No automated tests in CI.** All verification is manual or through the Postman
collection.

---

## Not production-ready

Stated plainly, because the distinction matters for an application in this domain.

What exists is a working, demonstrable application. Real users would additionally
require: encryption at rest, automated backups, monitoring and error tracking
that never captures journal text, a privacy policy and a lawful basis for
processing health-adjacent data, verified crisis resources for every region
served, and clinical review of the AI prompts and all clinical wording.

Several of those are not engineering work. They are named here rather than
implied.