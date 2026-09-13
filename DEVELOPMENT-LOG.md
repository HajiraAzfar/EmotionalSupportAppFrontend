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
| FR-AUTH-001 | Registration | Implemented (reworked) | Now email-first: submit an email, verify a 6-digit code, then set a password. See section 5a for the full rationale. |
| FR-AUTH-002 | Password storage | Implemented | Salted bcrypt; hash excluded from every response by schema design |
| FR-AUTH-003 | Email verification | Implemented (superseded by signup flow) | Legacy link-based endpoint (`/auth/verify-email`) still exists but is no longer called; verification now happens via the 6-digit signup code |
| FR-AUTH-004 | Indistinguishable failure | Implemented, with one deliberate exception | Login and forgot-password remain fully enumeration-safe. `/auth/signup` no longer is — see D-9 |
| FR-AUTH-005 | Rate limiting | Implemented | 5 failures per email per 15 minutes; applies to login and to code verification (signup and reset). See deviation D-3 |
| FR-AUTH-006 | Session handling | Implemented | 15-minute access token, 30-day rotating refresh token, family revocation on reuse. Verified this session via manual reuse/family-revocation test |
| FR-AUTH-007–014 | Application lock | Not started | Device-side only; scheduled after the entry engine |
| FR-AUTH-015 | Password reset | Implemented, reworked | Now code-based rather than link-based, resolving D-6. Legacy link-based endpoint (`/auth/reset-password`) still exists but is no longer called |
| FR-AUTH-016 | New-device notification | Implemented | Fingerprint via `X-Device-ID`; notification reveals nothing about the app |
| FR-AUTH-017 | Lock management | Not started | Device-side |

### 4.3 Onboarding

Unchanged this session. See prior entries below for original implementation notes.

| ID | Requirement | Status | Notes |
| --- | --- | --- | --- |
| FR-ONB-001 | Consent before other data | Implemented | Endpoint exists; ordering enforced by client routing |
| FR-ONB-002 | Consent version and timestamp | Implemented | |
| FR-ONB-003 | Re-ask on version change | Implemented | Current version served in `/onboarding/status`; client compares |
| FR-ONB-004 | Focus areas | Implemented | Zero or more; codes validated against the content set |
| FR-ONB-005 | Non-clinical labelling | Ongoing constraint | Codes are neutral; wording needs review — see D-7 |
| FR-ONB-006 | Distress baseline 0–10 | Implemented | Range enforced by schema; descriptions served from content |
| FR-ONB-007 | Elevated distress response | **Not started** | Still the highest-priority gap — see section 6 |
| FR-ONB-008 | Weekly goal | Implemented | Restricted to 2, 3, 5, 7; defaults to 3 |
| FR-ONB-009 | Skippable steps | Satisfied by design | No endpoint requires a prior step |
| FR-ONB-010 | Resumption | Implemented | `/onboarding/status` reports progress; client routes to the first unanswered step |

Everything from 4.4 onwards is not started, except a partial start on 4.8 (crisis resource list — see below).

---

## 2. Implemented endpoints

Nineteen. Authenticated endpoints require `Authorization: Bearer <access token>`.

| Method | Path | Auth | Requirement |
| --- | --- | --- | --- |
| GET | `/health` | No | — |
| POST | `/auth/signup` | No | FR-AUTH-001, 002 (begins signup — see D-9 for the 409 change) |
| POST | `/auth/verify-signup-code` | No | FR-AUTH-001, 003 |
| POST | `/auth/set-password` | No | FR-AUTH-001, 002 |
| POST | `/auth/login` | No | FR-AUTH-004, 005, 006, 016 |
| POST | `/auth/refresh` | No | FR-AUTH-006 |
| GET | `/auth/me` | Yes | FR-AUTH-006 |
| GET | `/auth/verify-email` | No | Legacy — unused by current flow |
| POST | `/auth/forgot-password` | No | FR-AUTH-015 |
| POST | `/auth/verify-reset-code` | No | FR-AUTH-015 |
| POST | `/auth/reset-password-code` | No | FR-AUTH-015 |
| POST | `/auth/reset-password` | No | Legacy — unused by current flow |
| GET | `/onboarding/status` | Yes | FR-ONB-003, 010 |
| GET | `/onboarding/distress-scale` | No | FR-ONB-006 |
| GET | `/onboarding/focus-areas/options` | No | FR-ONB-004 |
| POST | `/onboarding/consent` | Yes | FR-ONB-001, 002 |
| PUT | `/onboarding/focus-areas` | Yes | FR-ONB-004 |
| POST | `/onboarding/distress-baseline` | Yes | FR-ONB-006 |
| PUT | `/onboarding/goal` | Yes | FR-ONB-008 |
| GET | `/crisis/resources` | No | SRS 4.8 (partial) |

No endpoint exists for the application lock, deliberately: FR-AUTH-009 requires
the lock secret never to be transmitted, so building one would violate the
requirement.

---

## 3. Data model

Unchanged in table count; one column changed.

### `accounts`

**Change this session:** `password_hash` is now **nullable**. A row with a
null password represents a pending signup — the account exists (so the code
sent to it can be redeemed and the row is addressable), but there is no
password to log in with yet. An account only becomes fully usable — able to
log in, request a password reset — once `password_hash` is set.

Migration `192b351a7a1f` applied this change; reviewed before applying,
touches only this one column, reversible.

Otherwise unchanged: `id` (UUID), `email` (unique, indexed), `verified`,
`weekly_goal`, `interface_language`, `consent_version`, `consent_at`,
`distress_baseline`, `distress_baseline_at`, `created_at`, `updated_at`.

### `verification_tokens`

Structurally unchanged, but now serves more purposes than before. The table
already supported arbitrary `purpose` values, so no schema change was needed
— only new values were added to that column:

- `verify_email` — legacy, link-based, 24 hours (unused by current flow)
- `password_reset` — legacy, link-based, 1 hour (unused by current flow)
- `signup_verify` — new, 6-digit code, 15 minutes
- `set_password` — new, setup token issued after a signup code is redeemed, 30 minutes
- `password_reset_code` — new, 6-digit code, 15 minutes
- `password_reset_from_code` — new, reset token issued after a reset code is redeemed, 30 minutes

Codes and tokens share the same `token_hash` column and hashing function
(SHA-256); a 6-digit code is simply a shorter, numeric raw value before
hashing. Redeeming a code requires the caller to supply the associated
`account_id` (looked up by email first), unlike link tokens, which are
looked up by hash alone — a 6-digit space is small enough that this
scoping matters.

### Other tables (`focus_areas`, `refresh_tokens`, `known_devices`)

Unchanged this session.

---

## 4. Deviations from the SRS

Sections D-1 through D-8 are unchanged from the prior log entry and are not
repeated here in full — see git history for that text if needed. Two are
newly superseded, and one new deviation is added.

**D-6 — Password reset cannot be completed on the client.**
*Superseded.* Password reset is now code-based rather than link-based:
the client requests a code by email, submits it in-app, and sets a new
password entirely within the app. No browser hop, no deep linking required.
The original link-based endpoint (`/auth/reset-password`) remains in the
codebase, unused by the current flow.

**D-9 — Signup now reveals whether an email is already registered (new).**
`/auth/signup` was originally designed to return an identical response
regardless of whether the submitted email was new, pending, or already
fully registered — matching the enumeration-safety property already applied
to login and forgot-password. This was changed on request: a fully
registered email now receives an immediate `409 Conflict` with a message
directing the user to sign in, rather than a generic accepted response.

This is a deliberate trade-off, not an oversight. It improves the signup
UX (the client can show "you already have an account" immediately, rather
than sending the user through a verification-code screen only to learn
later that no code was actually issued), at the cost of allowing an
attacker to probe arbitrary email addresses against `/auth/signup` to learn
which ones are registered. Login and forgot-password remain fully
enumeration-safe; only this one endpoint carries the trade-off. Worth
revisiting before a public launch, weighed against the actual UX benefit
observed.

---

## 5. New this session

### 5a. Signup reworked to email-first, code-verified, then password

**Motivation.** The original SRS-specified flow accepted an email and
password together at signup. The product decision this session was to
verify the email is reachable *before* asking for a password: a user should
prove they own an inbox by receiving and entering a code, and only then
choose a password, rather than committing a password to an address that
might be mistyped or not theirs.

**Flow, in three endpoints:**
1. `POST /auth/signup` — `{email}`. Creates a pending account (or resends a
   code to an existing pending one) and emails a 6-digit code, valid 15
   minutes. Returns `202` with a generic message for new and pending
   accounts; returns `409` immediately for already-registered accounts (see
   D-9).
2. `POST /auth/verify-signup-code` — `{email, code}`. Rate-limited like
   login. Redeems the code (scoped to the account looked up by email, since
   a 6-digit space isn't unique enough to look up by hash alone), marks the
   account verified, and issues a short-lived (30-minute) `setup_token`.
3. `POST /auth/set-password` — `{setup_token, password}`. Redeems the setup
   token, sets the password, and returns the account's first access/refresh
   token pair — the same response shape the old one-step signup used to
   return, so the client's post-signup routing needed no change beyond
   splitting the screen into three.

**Email delivery, on failure, is handled deliberately.** If the initial
code email fails to send for a brand-new signup, the pending account row is
deleted rather than left behind as permanent dead weight. This distinction
matters: a failed *send* means the address can never be used to complete
signup, so the row serves no purpose. A successfully sent code that the
user simply never enters is different — that account is left alone, and
the code expires naturally after 15 minutes; the user can always request a
fresh one by signing up again with the same address.

**Rate limiting reused, not duplicated.** Code verification uses the same
`is_rate_limited` / `record_failure` / `clear_failures` functions already
built for login, rather than a parallel implementation — five wrong-code
attempts per email in fifteen minutes, same as a wrong password.

### 5b. Password reset reworked to match the signup shape

Same three-step pattern applied to password reset, resolving D-6:
`forgot-password` → `verify-reset-code` → `reset-password-code`. A reset
code is only sent if the account is fully registered (`password_hash` is
not null); a pending account produces the same generic `200` response but
no email, since there is nothing yet to reset. Successful reset revokes
every existing session for the account, as the original link-based
endpoint already did.

The legacy `/auth/reset-password` endpoint (link-based, POST-only, the
original source of D-6) remains in the router, callable, but nothing in
the current signup or reset flow generates a token for it anymore.

### 5c. `main.py` router registration bug fixed

Found and fixed independently of the signup rework: `app/main.py` had
`onboarding` referenced in `app.include_router(onboarding.router)` without
being imported in the line above it, raising `NameError` on startup. The
file also had three overlapping, partially redundant import lines for the
same routers. Consolidated to a single clean import and one
`include_router` call per router.

### 5d. Frontend rebuilt for the new signup and reset flows

`SignupScreen` now collects only an email. Two new screens —
`VerifySignupCodeScreen` and `SetPasswordScreen` — were added to complete
the flow; `SetPasswordScreen` is shared between signup and reset, since
both reduce to "redeem a token, submit a password, receive a session."
`ForgotPasswordScreen` was rewritten to match (code-based rather than
link-based), and a new `VerifyResetCodeScreen` was added. `App.tsx` routing
was extended with the new screen states and the transient values
(`pendingEmail`, `setupToken`, `resetToken`) that carry between steps.

No changes were needed to `LoginScreen`, `client.ts`, `tokens.ts`, `Field`,
`PrimaryButton`, or any onboarding screen — the rework was scoped
correctly to just the auth entry points.

---

## 6. Highest-priority gap: FR-ONB-007

Unchanged from the prior log entry — not addressed this session.

FR-ONB-007 requires a support response when someone selects 9 or 10 on the
distress scale during onboarding. Currently those values save like any other
and the flow continues to the weekly goal screen.

That is the wrong behaviour for this application. Someone reporting severe
distress before they have written anything is the person most in need of an
immediate route to help, and the application currently offers them a Continue
button.

Implementing it requires verified crisis helpline numbers for Pakistan — which the
SRS also requires for the crisis module in section 4.8, so the two should be done
together and the resource list shared. A `/crisis/resources` endpoint and content
set now exist (see section 2), so the resource list itself is no longer the
blocker; wiring FR-ONB-007's trigger to it is still outstanding.

---

## 7. Testing performed this session

Verified manually through `/docs`, since the new endpoints did not exist in
the previous automated Postman collection. A new, more thorough collection
was written covering every endpoint including the new signup and reset
flows — see `Echo-Auth-Full-Test-Collection-v2.postman_collection.json` in
the repository root (not yet run end-to-end as a single pass; individual
sections were verified manually first).

| Area | Cases verified |
| --- | --- |
| Signup — new flow | Fresh email, resend on pending, invalid email format, missing email, wrong code, correct code, code reuse, invalid setup token, short password, valid set-password (tokens issued, `verified: true`, no `password_hash` leak), setup token reuse, signup on now-registered email (`409`, confirming D-9) |
| Login | Correct credentials, wrong password, non-existent email (byte-identical to wrong password), rate limiting after 5 failures, pending account rejected same as wrong password |
| Refresh | Valid rotation, reuse of a consumed token rejected, **family revocation confirmed** — the newly-issued token from a rotation is also rejected once the reuse is detected, invented token, empty token |
| `/auth/me` | Valid token, no token, garbage token, missing `Bearer` prefix |
| Password reset — new flow | Registered vs. non-existent forgot-password (byte-identical), wrong reset code, correct reset code, reset with valid token, reset-token reuse rejected, login with new password succeeds, login with old password fails (session revocation confirmed) |
| Pending-account guards | Signup resend on pending account still `202` not `409`, login rejected, forgot-password produces no email |

A temporary debug `print()` statement was added to `create_code()` in
`app/core/verification.py` to read generated codes directly from the server
console during testing, since Resend cannot currently deliver to arbitrary
test addresses (see section 8 and the Known limitations in the README).
**This line must be removed before any deployment** — flagged in the README
under Security notes so it isn't forgotten.

Client testing is manual on the emulator; the new screens have not yet been
walked end-to-end on-device as of this log entry (code was written and
reviewed, but the person doing the work had not yet run the full signup →
consent flow at the time of writing).

---

## 8. Known blocker: email delivery limited to one address

Resend, without a verified sending domain, delivers only to the address the
Resend account itself was created with. This blocked initial testing until
traced back to its cause (a Supabase password-reset email that arrived
during testing was determined to be unrelated — the project does not use
Supabase Auth, per D-1 — and was likely leftover activity from Supabase's
own account system, not this application).

Domain verification requires DNS access, which is not available (the
domain in question belongs to the organisation, not to the person doing
this work, who does not hold DNS credentials for it). Two paths forward:
request domain verification from whoever holds DNS access, or continue
testing against the Resend account's own address until that is arranged.

The temporary debug-print workaround (section 7) allows development to
continue in the meantime without depending on email delivery at all.

---

## 9. Session log

### Session 1 — 6–7 September 2026
### Session 2 — 7–8 September 2026
### Session 3 — 9 September 2026

Unchanged — see prior log entries.

### Session 4 — 10–11 September 2026

Reworked signup and password reset to the code-based flow described in
section 5. Fixed the `main.py` startup bug (section 5c). Rebuilt the
corresponding frontend screens (section 5d). Diagnosed and worked around
the Resend single-address delivery limitation with a temporary debug print.
Wrote a new, more thorough Postman collection covering both new flows and
the changed `409` signup behaviour. Manually verified refresh token family
revocation for the first time (previously implemented but not directly
exercised in prior testing).

Crisis resources endpoint and content set (`/crisis/resources`,
`app/content/crisis_resources.json`) were added — origin predates this
session's detailed log entries but is reflected in the endpoint table above
for completeness. FR-ONB-007's trigger to this resource list remains
unbuilt.

---

## 10. Next steps

1. **Remove the debug print** in `create_code()` before this branch goes
   anywhere near a shared or production environment.
2. **Resolve Resend domain verification** — needed before any real user
   other than the Resend account holder can complete signup or reset.
3. **FR-ONB-007** — wire the elevated distress response to the now-existing
   crisis resource list.
4. **Decide the fate of the legacy link-based endpoints** (`/auth/verify-email`,
   `/auth/reset-password`) — remove, or repurpose, now that neither is
   called by the current flow.
5. **Revisit D-9** before public launch — confirm the signup
   enumeration-safety trade-off is still the right call once real user
   volume is a consideration.
6. **Entry engine (SRS 4.5)** — `Entry`, `Message` and `CapturedValue`
   models, capture schedule loading, step-level persistence. Still the
   largest remaining piece of the application.
7. **Secure token storage** — replace AsyncStorage (deviation D-8,
   unchanged from prior sessions).

Remaining after that: the other four journal types, selection libraries,
crisis detection logic beyond the resource list, AI reflection, insights,
learning library, data control, and the device-side application lock.