# Homepage Admission-Lead Popup — Design

**Date:** 2026-08-13
**Status:** Approved

## Purpose

Collect admission leads from homepage visitors. After a configurable delay
(default 15s) on the homepage, a modal invites the visitor to leave their name,
mobile number, and the programme they're interested in. Submissions land in the
admin dashboard and trigger an email to the admission team.

## Scope

- Public: one modal on `/` only. Not on any other route.
- Admin: settings (content + behaviour) and a leads inbox.
- Backend: one POST endpoint, persistence, email notification.

Explicitly **out of scope**: A/B testing, exit-intent triggers, scroll-depth
triggers, multi-step forms, lead assignment/CRM workflow, SMS.

## Data model

Two new Prisma models.

### `AdmissionLeadPopupSettings` (singleton)

Follows the `ServiceCharterLanding` singleton convention (`id @default("singleton")`).

| Field | Type | Notes |
|---|---|---|
| `enabled` | `Boolean` | Master on/off. Default `true`. |
| `delaySeconds` | `Int` | Delay before showing. Default `15`. |
| `heading` | `String` | "Start your journey with Sonargaon University" |
| `subheading` | `String` | "Get personalized admission guidance from our admission team." |
| `nameLabel` / `namePlaceholder` | `String` | |
| `phoneLabel` / `phonePlaceholder` | `String` | |
| `programmeLabel` / `programmePlaceholder` | `String` | Placeholder is the empty-value option text. |
| `buttonLabel` | `String` | "Get admission guidance" |
| `footnote` | `String` | "Our admission team will contact you shortly." |
| `successMessage` | `String` | Shown after submit. |
| `notifyEmail` | `String?` | Null → falls back to `UniversityIdentity.contactSubmissionEmail`. |

### `AdmissionLead` (multi-row)

Mirrors `ContactSubmission`, including its forensics + email-dispatch metadata.

| Field | Type | Notes |
|---|---|---|
| `name` | `String` | |
| `phone` | `String` | |
| `programmeName` | `String` | **Snapshot, not FK.** A renamed or deleted Program must not mutate or orphan historical leads. |
| `status` | `String` | `new` \| `read` \| `archived`. Default `new`. Matches `ContactSubmission.status` convention. |
| `ipAddress`, `userAgent` | `String?` | Same nullable shape as `ContactSubmission`. |
| `submittedAt` | `DateTime` | |
| `emailSentAt`, `emailError` | `DateTime?` / `String?` | Dispatch diagnostics; null email = skipped or failed. |

Indexes: `[status, submittedAt]` and `[submittedAt]`, matching the query shapes
the admin list uses (filter-by-status, newest-first).

## Public component

`AdmissionLeadPopup` — client component, rendered from the homepage server
component which passes `settings` and the live `Program` list as props.

**Trigger logic:**
1. If `!settings.enabled`, render nothing.
2. On mount, read `localStorage['su-cse-admission-lead-popup']`. If set, render nothing.
3. Otherwise `setTimeout(delaySeconds * 1000)`. When it fires: show the modal
   **and immediately write the localStorage flag**.

Writing the flag on *show* rather than on close is deliberate: a visitor who
reloads mid-countdown would otherwise restart the timer forever and eventually
be shown the modal repeatedly across reloads.

**Form:** Full name (required), Mobile number (required), Programme (required,
`<select>` populated from live Programs), plus the same hidden honeypot field
convention the contact form uses. Validation is non-empty only — no strict phone
regex, matching how `ContactSubmission.phone` is already handled.

**Dismissal:** X button, backdrop click, and Escape. Body scroll-locks while
open, mirroring the public `Navbar` mobile-drawer pattern.

**Post-submit:** inline success state showing `successMessage`, auto-closing
after a short delay.

## API

`POST /api/admission-lead/submit` — a route handler (not a server action,
because it is called from a public client component).

Same sequence as `/api/contact/submit`:
honeypot check → IP rate-limit (`checkRateLimit`) → Zod validation → persist →
send email → patch `emailSentAt`/`emailError` → revalidate admin paths.

Email goes through a new `sendAdmissionLeadNotification` in `lib/email.ts`,
built on the same Resend wrapper and graceful-degradation contract as
`sendContactNotification` (missing API key or missing recipient = skipped, not
an error; the lead is still saved and the request still succeeds).

## Admin

Two pages under a new **Admission Leads** sidebar entry:

- `/admin/admission-lead-popup` — settings form (server action + Zod, the
  standard admin CRUD pattern in this codebase).
- `/admin/admission-leads` — leads inbox: status filter pills with counts and a
  list, directly mirroring `/admin/contact-submissions`. Row actions mark
  read/archived.

The sidebar entry carries an unread-count badge, same as Contact Submissions.

## Testing

Verify by: `tsc --noEmit`, a production build, then a live smoke test —
confirm the popup does not appear before the delay, appears after it, submits
successfully, persists a row, and does not reappear on reload.
