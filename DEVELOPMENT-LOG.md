# Development Log — Echo

Implementation record for SRS-ESC-001 v0.9.

Kept in the repository root and updated at the end of each working session. Its
purpose is to record **what was built, what was deferred, and why** — the
reasoning is the part hardest to reconstruct later.

For setup instructions, architecture and current gaps, see [README.md](README.md).

---

## 1. Requirements status

### 4.2 Authentication

| ID | Requirement | Status | Notes |
| --- | --- | --- | --- |
| FR-AUTH-001 | Registration | Implemented | Duplicate email returns 409 with sign-in guidance; 8-character minimum enforced by schema |
| FR-AUTH-002 | Password storage | Implemented | Salted bcrypt; hash excluded from every response by schema design |
| FR-AUTH-003 | Email verification | Implemented | 24-hour single-use link; never blocks app use |
| FR-AUTH-004 | Indistinguishable failure | Implemented | Identical body, status and content-length for both failure modes |
| FR-AUTH-005 | Rate limiting | Implemented | 5 failures per email per 15 minutes; see deviation D-3 |
| FR-AUTH-006 | Session handling | Implemented | 15-minute access token, 30-day rotating refresh token, family revocation on reuse |
| FR-AUTH-007–014 | Application lock | Not started | Device-side only; scheduled after the entry engine |
| FR-AUTH-015 | Password reset | Implemented (backend) | 60-minute single-use token, all sessions revoked, enumeration-safe response. No client screen — see D-6 |
| FR-AUTH-016 | New-device notification | Implemented | Fingerprint via `X-Device-ID`; notification reveals nothing about the app |
| FR-AUTH-017 | Lock management | Not started | Device-side |

### 4.3 Onboarding

| ID | Requirement | Status | Notes |
| --- | --- | --- | --- |
| FR-ONB-001 | Consent before other data | Implemented | Endpoint exists; ordering enforced by client routing |
| FR-ONB-002 | Consent version and timestamp | Implemented | |
| FR-ONB-003 | Re-ask on version change | Implemented | Current version served in `/onboarding/status`; client compares |
| FR-ONB-004 | Focus areas | Implemented | Zero or more; codes validated against the content set |
| FR-ONB-005 | Non-clinical labelling | Ongoing constraint | Codes are neutral; wording needs review — see D-7 |
| FR-ONB-006 | Distress baseline 0–10 | Implemented | Range enforced by schema; descriptions served from content |
| FR-ONB-007 | Elevated distress response | **Not started** | Highest-priority gap — see section 5 |
| FR-ONB-008 | Weekly goal | Implemented | Restricted to 2, 3, 5, 7; defaults to 3 |
| FR-ONB-009 | Skippable steps | Satisfied by design | No endpoint requires a prior step |
| FR-ONB-010 | Resumption | Implemented | `/onboarding/status` reports progress; client routes to the first unanswered step |

Everything from 4.4 onwards is not started.

---

## 2. Implemented endpoints

Fifteen. Authenticated endpoints require `Authorization: Bearer <access token>`.

| Method | Path | Auth | Requirement |
| --- | --- | --- | --- |
| GET | `/health` | No | — |
| POST | `/auth/signup` | No | FR-AUTH-001, 002, 003 |
| POST | `/auth/login` | No | FR-AUTH-004, 005, 006, 016 |
| POST | `/auth/refresh` | No | FR-AUTH-006 |
| GET | `/auth/me` | Yes | FR-AUTH-006 |
| GET | `/auth/verify-email` | No | FR-AUTH-003 |
| POST | `/auth/forgot-password` | No | FR-AUTH-015 |
| POST | `/auth/reset-password` | No | FR-AUTH-015 |
| GET | `/onboarding/status` | Yes | FR-ONB-003, 010 |
| GET | `/onboarding/distress-scale` | No | FR-ONB-006 |
| GET | `/onboarding/focus-areas/options` | No | FR-ONB-004 |
| POST | `/onboarding/consent` | Yes | FR-ONB-001, 002 |
| PUT | `/onboarding/focus-areas` | Yes | FR-ONB-004 |
| POST | `/onboarding/distress-baseline` | Yes | FR-ONB-006 |
| PUT | `/onboarding/goal` | Yes | FR-ONB-008 |

No endpoint exists for the application lock, deliberately: FR-AUTH-009 requires
the lock secret never to be transmitted, so building one would violate the
requirement.

---

## 3. Data model

Six tables plus Alembic's own. Seven migrations applied in sequence.

### `accounts`
`id` (UUID), `email` (unique, indexed), `password_hash`, `verified`,
`weekly_goal`, `interface_language`, `consent_version`, `consent_at`,
`distress_baseline`, `distress_baseline_at`, `created_at`, `updated_at`.

All onboarding fields are nullable, because every step except consent is optional
and the sequence can be interrupted. A null value is how the status endpoint knows
which step remains.

### `focus_areas`
`id`, `account_id` (FK, cascade), `code`. Unique on `(account_id, code)`.

Stored as codes rather than display text, so wording lives in the content set
where it can be reviewed and translated.

### `refresh_tokens`
`id`, `account_id` (FK, cascade), `family_id`, `token_hash` (unique), `used`,
`revoked`, `expires_at`, `created_at`.

`family_id` groups every token descended from one sign-in, which is what allows an
entire session lineage to be revoked in one query. `used` and `revoked` are
separate: used means legitimately exchanged, revoked means killed by a security
event.

### `verification_tokens`
`id`, `account_id` (FK, cascade), `token_hash` (unique), `purpose`, `used`,
`expires_at`, `created_at`.

One table serves both email verification and password reset, distinguished by
`purpose`. They need identical fields and differ only in lifetime and in what
redemption does.

### `known_devices`
`id`, `account_id` (FK, cascade), `fingerprint`, `first_seen_at`, `last_seen_at`.
Unique on `(account_id, fingerprint)`.

No IP address, user agent or location. A richer notification would be possible,
but that would mean storing a record of where a user was and when.

### Design decisions

**UUID primary keys throughout.** With sequential integers, user #47 knows at
least 47 accounts exist and can guess that #46 does too. For an application
holding mental health data, identifiers that leak nothing matter.

**Credentials stored as hashes only.** Passwords with bcrypt (deliberately slow,
salted automatically). Refresh and verification tokens with SHA-256 — fast is
correct there, because a 48-byte random token cannot be brute-forced and slowness
would only add latency to every refresh.

**Cascade deletes on every foreign key to `accounts`.** Required for the data
control module in SRS 4.12: deleting an account must leave no orphaned rows.

---

## 4. Deviations from the SRS

Each is a deliberate decision, not an oversight. All should be reflected in the
SRS before submission.

**D-1 — Supabase used for the database only.**
The SRS assumes a self-managed PostgreSQL instance. Supabase provides hosted
PostgreSQL with automated backups and a publicly reachable address, which the
project needs for deployment and demonstration. Supabase Auth is *not* used;
authentication is implemented in FastAPI as specified. The Supabase Data API is
disabled, so the database is reachable only through this backend.

**D-2 — Session handling now matches the SRS.**
*Superseded.* This deviation originally recorded a single seven-day access token
with refresh rotation deferred. Rotation, single-use consumption, and family
revocation on reuse are now implemented, with a 15-minute access token and a
30-day refresh token. No deviation remains.

**D-3 — Rate limiting held in application memory.**
FR-AUTH-005 is satisfied functionally, but failure counts are stored in a
process-level dictionary. They reset on restart and are not shared across
processes. A production deployment would use Redis or an equivalent shared store.

**D-4 — Email-dependent requirements now implemented.**
*Superseded.* FR-AUTH-003, 015 and 016 were originally deferred pending an email
service. Resend is now integrated and all three are implemented. One limitation
remains: without a verified sending domain, Resend delivers only to the account
holder's own address, so nobody else can register and receive mail until a domain
is verified.

**D-5 — Distress scale wording is provisional.**
FR-ONB-006 names the Clinical Advisor as the source for the eleven descriptions
accompanying each 0–10 value. The current wording in
`app/content/distress_scale.json` is placeholder text and requires clinical review
before demonstration.

**D-6 — Password reset cannot be completed on the client.**
Both endpoints work and are tested. The reset link opens a browser and hits a
POST-only endpoint, because completing a reset requires the new password and a
link click cannot carry one. Two routes forward: deep linking, so the link opens
the app with its token; or switching both flows to typed codes, which suits a
mobile-only application better and removes the deep-linking work but deviates
from the SRS's link-based specification. Undecided.

**D-7 — Focus area labels diverge between design and implementation.**
The visual design proposes seven options (including "Anxiety & Worry" and
"Grief & Loss"); the backend content set defines five different codes. Both need
reconciling. Separately, some of the proposed labels sit closer to clinical
language than FR-ONB-005 ideally wants — a woman selecting "Trauma" from a list is
being asked to categorise herself diagnostically before writing anything. The
codes are neutral; the display wording is the open question.

**D-8 — Device tokens stored unencrypted.**
The client uses AsyncStorage, which is plain text on disk. Tokens are bearer
credentials. Secure device storage via the Android Keystore is required before
real use. AsyncStorage was chosen to make progress, not because it is correct.

---

## 5. Highest-priority gap: FR-ONB-007

Recorded separately because it is the one gap with a safety dimension.

FR-ONB-007 requires a support response when someone selects 9 or 10 on the
distress scale during onboarding. Currently those values save like any other and
the flow continues to the weekly goal screen.

That is the wrong behaviour for this application. Someone reporting severe
distress before they have written anything is the person most in need of an
immediate route to help, and the application currently offers them a Continue
button.

Implementing it requires verified crisis helpline numbers for Pakistan — which the
SRS also requires for the crisis module in section 4.8, so the two should be done
together and the resource list shared.

---

## 6. Technical decisions

**Capture schedules will be external JSON, not database rows.**
FR-ENT-001 requires that adding a value to a journal type needs no application
code change. Loading schedules from files at startup satisfies this and keeps
journal definitions reviewable in version control. Not yet built.

**Clinical content lives in `app/content/`, not in code.**
Wording a clinical reviewer may need to change is stored as JSON and loaded at
startup, so review does not require reading Python. Focus area codes are validated
against that file, so an unrecognised code is rejected with a 422 naming it.

**Authentication is a dependency, not per-endpoint code.**
`get_current_user` extracts and verifies the bearer token and returns the account.
Every protected endpoint declares it as a parameter, so the check cannot be
forgotten when adding an endpoint.

**Models and schemas are separate files.**
`password_hash` exists on the model and in no response schema. That is a
structural guarantee rather than something to remember at each call site.

**Client validates for speed, server validates for safety.**
The sign-up screen checks password length before making a request, so the user is
told immediately. The backend enforces the same rule, because that is the one that
cannot be bypassed.

**`pool_pre_ping` and `pool_recycle` enabled on the database engine.**
Supabase's connection pooler closes idle connections. Without pre-ping,
SQLAlchemy hands out a dead connection after a quiet period and the request fails
with `server closed the connection unexpectedly`. Observed in testing and fixed.

**Email failures are swallowed, not logged.**
Normally an exception would be logged. Here the recipient is a user's email
address, and error logs are routinely shipped to monitoring services — where an
address becomes a record that someone uses a mental health application.

**Design tokens confined to one file.**
Every colour, type size and spacing value in the client lives in `src/theme.ts`.
Changing the palette or the typeface is a single-file change.

---

## 7. Testing performed

Verified through the generated OpenAPI interface (`/docs`) and an automated
Postman collection of roughly sixty assertions, all passing.

| Area | Cases |
| --- | --- |
| Registration | New account, duplicate email, 7-character password, 8-character boundary, malformed email, missing field |
| Sign-in | Correct credentials, wrong password, unregistered email with byte-identical response, malformed email |
| Protected endpoints | Valid token, no header, missing `Bearer` prefix, tampered token, invented token, wrong method |
| Refresh rotation | Valid exchange, second exchange, replay of a consumed token, family revocation after replay, invented token, empty token |
| Rate limiting | Five failures then a correct password refused with 429; lockout confirmed per-account, not global |
| Email verification | Invented token, missing parameter; manual: email arrives, link works once, second use rejected, `verified` becomes true |
| Password reset | Registered and unregistered addresses byte-identical, malformed address, invented token, short new password, GET on a POST endpoint; manual: link arrives, reset succeeds, old password rejected, new password accepted, token single-use |
| New device | Missing header does not block sign-in; manual: first sighting notifies, repeat does not, second device notifies |
| Onboarding | Status before and after, consent, focus areas with two/duplicate/empty/unknown codes, distress at 0, 6, 10, 11, −1 and a non-integer, goal at 2, 7, 4, 6, 99 |
| Isolation | A second account sees none of the first account's onboarding data |

Client testing is manual on the emulator. No automated test suite runs in CI.

---

## 8. Session log

### Session 1 — 6–7 September 2026

Environment set up from an empty repository: virtual environment, FastAPI,
package structure, Supabase project, Alembic.

Implemented the authentication account layer (Account model, bcrypt hashing,
sign-up, sign-in, JWT issuance and verification, `get_current_user`, rate
limiting) and the onboarding backend (consent, focus areas, distress baseline,
weekly goal, distress scale content, status endpoint).

Three migrations applied. Issue found and fixed: stale connections from the
Supabase pooler, resolved with `pool_pre_ping` and `pool_recycle`.

### Session 2 — 7–8 September 2026

Completed the authentication backend. Added refresh token rotation with family
revocation (FR-AUTH-006 in full), integrated Resend, and implemented email
verification (FR-AUTH-003), password reset (FR-AUTH-015) and new-device
notification (FR-AUTH-016). Four further migrations.

Added a focus area content set with validation, closing a gap where any string was
accepted as a focus area code.

Built the automated Postman collection and brought it to a full pass.

React Native project created. Environment setup consumed most of this session; the
causes are recorded in the README so they are not rediscovered: a 32-bit JDK
prevented the Kotlin plugin from running at all, the NDK had to be installed
manually, and Windows Firewall was silently blocking Node from accepting
connections, which left the client unable to reach Metro.

### Session 3 — 9 September 2026

Brand direction established: **Echo**, "A quiet companion for your loudest
thoughts", with a sage and eucalyptus palette on warm off-white and botanical
line art.

Built the client foundation — design tokens, a button and a text field component,
an API client, token storage — then the welcome, sign-up, sign-in, forgot-password
and home screens, and the four onboarding screens (consent, focus areas, distress,
weekly goal).

Wired screen routing with resume logic: on launch the client asks
`/onboarding/status` and routes to the first unanswered step, satisfying
FR-ONB-010.

Deferred deliberately: Google Sign-In (not in the SRS, and it would link a Google
account to a mental health application), and OTP-based verification (would rewrite
two working flows).

---

## 9. Next steps

1. **FR-ONB-007** — the elevated distress response. Needs verified helpline
   numbers for Pakistan; do it alongside the crisis module's resource list.
2. **Entry engine (SRS 4.5)** — `Entry`, `Message` and `CapturedValue` models,
   capture schedule loading, step-level persistence. The core of the application
   and the largest remaining piece.
3. **Check-in journal (FR-JRN-001)** — one journal type working end to end before
   the remaining four are added.
4. **Secure token storage** — replace AsyncStorage (deviation D-8).

Remaining after that: the other four journal types, selection libraries, crisis
detection, AI reflection, insights, learning library, data control, and the
device-side application lock.
