# CLAUDE.md — AsiaCommerce Event

## 1. Project

This repository contains the AsiaCommerce Event Management Platform.

Production domain:

`https://event.asiacommerce.net`

Core infrastructure:
- Next.js
- TypeScript
- Vercel
- Neon PostgreSQL
- Drizzle ORM

Read `PRD.md` before implementing product features.

---

## 2. Primary Objective

Build a production-ready event management platform with:

- Public event discovery
- SEO-friendly event landing pages
- Participant registration
- Google authentication
- WhatsApp OTP authentication
- AsiaCommerce SSO for admins
- Ticket management
- Free and paid events
- Xendit payment integration
- Manual payment
- Static QRIS
- Email notifications
- WhatsApp notifications
- Event reminders
- Admin dashboard
- Participant management
- SEO / Open Graph / Schema.org
- Analytics
- Secure Vercel + Neon architecture

Do not treat this as a prototype-only application. Critical flows must be designed for production reliability.

---

# 3. Non-Negotiable Engineering Rules

## TypeScript

- Use TypeScript strictly.
- Avoid `any`.
- Do not disable strict type checking to make implementation easier.
- Define proper domain types.
- Prefer inferred types from Drizzle schema where practical.

## Next.js

- Use Next.js App Router.
- Use Server Components by default.
- Use Client Components only when interaction/state requires them.
- Keep server-only logic on the server.
- Never expose secrets to client components.
- Use route handlers for webhooks and APIs that need HTTP endpoints.
- Use Server Actions for suitable internal mutations when they improve architecture.

## Database

- Use Neon PostgreSQL.
- Use Drizzle ORM.
- Database access must remain server-side.
- Never access the database directly from client components.
- Use migrations for schema changes.
- Do not manually mutate production schema when a migration can represent the change.
- Add proper indexes and unique constraints for business-critical fields.

## Validation

- Use Zod for external/user input.
- Validate:
  - forms
  - query parameters
  - route parameters
  - API bodies
  - webhook payloads where possible
  - admin configuration
- Never trust client-side validation alone.

---

# 4. Security Rules

Security is a first-class requirement.

Always:

- Use HTTPS.
- Use secure, httpOnly cookies where appropriate.
- Protect admin routes with authentication and authorization.
- Implement RBAC where required.
- Validate authorization server-side.
- Protect against XSS.
- Use parameterized queries through Drizzle.
- Rate-limit OTP endpoints.
- Rate-limit sensitive public endpoints.
- Never store raw OTP values.
- Never expose API secrets to the browser.
- Never trust payment status from the client.
- Verify payment webhooks.
- Make payment webhooks idempotent.
- Validate uploaded files.
- Restrict image/file sizes and MIME types.
- Avoid arbitrary HTML/JavaScript injection.
- Log security-sensitive admin actions.
- Never commit `.env` files or secrets.

---

# 5. Authentication Architecture

There are two separate authentication domains.

## Participant Authentication

Supported:
- Google OAuth
- WhatsApp OTP

Participant authentication must never grant admin access.

## Admin Authentication

Admin authentication uses:

`https://sso.asiacommerce.net`

Admin routes must verify the SSO session/token server-side.

Do not implement a separate password system for admins unless explicitly requested.

---

# 6. Authorization

Use role-based authorization.

Recommended roles:

```text
SUPER_ADMIN
EVENT_ADMIN
```

Never rely only on hiding buttons in the frontend.

Every privileged action must be authorized server-side.

---

# 7. Event State Model

Do NOT use one generic status field for everything.

Event has lifecycle status:

```text
draft
published
cancelled
archived
```

Display status is calculated from event time:

```text
Upcoming
On Going
Past
```

Registration has its own status.

Payment has its own status.

Example:

```text
Event:
lifecycle_status = published
display_status = upcoming

Registration:
status = confirmed

Payment:
status = paid
```

This separation is mandatory.

---

# 8. Event URL Architecture

Preferred canonical event URL:

```text
https://event.asiacommerce.net/[slug]
```

Event directory:

```text
https://event.asiacommerce.net/events
```

Short URL:

```text
https://event.asiacommerce.net/[shortCode]
```

Example:

```text
/ai-starter-pack-for-umkm
/8hdbkk92
```

Short code:
- exactly 8 characters
- lowercase
- alphanumeric
- cryptographically/randomly generated enough to avoid predictable collisions
- unique at database level

Short URLs must redirect to the canonical event URL.

Use HTTP 301 for normal permanent redirects unless product requirements require another behavior.

Do not create ambiguous routing that makes an event slug look like a short code without checking the database/routing rules carefully.

---

# 9. Event Slug Rules

Slug must be:

- lowercase
- kebab-case
- URL-safe
- unique

Example:

```text
ai-starter-pack-for-umkm
```

If collision occurs, generate a unique suffix.

Never silently overwrite another event.

---

# 10. Ticket Inventory Rules

Ticket inventory is business-critical.

When a ticket has a quota:

- Prevent overselling.
- Use database transactions.
- Use appropriate locking/atomic update strategy.
- Validate availability again during final registration/payment creation.
- Never rely only on frontend displayed quota.

Multiple users may submit registration concurrently.

The database must remain the source of truth.

---

# 11. Payment Rules

Supported payment modes:

```text
Xendit
Manual
Static QRIS
```

Payment statuses:

```text
pending
paid
expired
failed
cancelled
```

Never mark payment as paid because:

- User returned to a success page.
- User clicked a button.
- Client sent `paid`.
- Frontend received a success response without server verification.

For Xendit:

```text
Xendit Webhook
      ↓
Verify
      ↓
Validate
      ↓
Idempotency Check
      ↓
Database Transaction
      ↓
Payment = PAID
      ↓
Registration = CONFIRMED
      ↓
Notification
```

Webhook processing must be safe to execute more than once.

---

# 12. Registration Rules

Default required fields:

```text
Name
Email
WhatsApp Number
```

Admin can add custom fields.

Default V1 rule:

One participant can have one active registration for the same event.

Prevent duplicate registrations unless the product requirement explicitly changes.

Registration code must be unique.

Recommended format:

```text
AC-2026-XXXXXX
```

---

# 13. Registration State

Use:

```text
pending_payment
payment_verification
confirmed
cancelled
waitlisted
```

For free events:

```text
registration created
→ confirmed
```

For paid events:

```text
registration created
→ pending_payment
→ payment confirmed
→ confirmed
```

Do not mark paid event registration as confirmed before payment is verified, unless the payment mode explicitly uses manual verification and the product state is designed accordingly.

---

# 14. Notification Architecture

Do not place email/WhatsApp provider logic directly inside registration components.

Use services/interfaces:

```ts
sendEmail(...)
sendWhatsAppMessage(...)
```

Notification types:

```text
registration_confirmation
payment_confirmation
event_reminder_1d
event_day
```

Channels:

```text
email
whatsapp
```

Notifications should support:

- scheduled sending
- retries
- failure logging
- provider message IDs
- idempotency where applicable

---

# 15. Provider Abstraction

Payment:

```text
services/payment/
```

Email:

```text
services/email/
```

WhatsApp:

```text
services/whatsapp/
```

Do not tightly couple business logic to one provider.

For example:

```text
Registration Service
       ↓
Payment Service
       ↓
Payment Provider
```

not:

```text
Registration Component
       ↓
Xendit API directly
```

This makes provider replacement and testing easier.

---

# 16. Database Design Rules

Core tables:

```text
users
events
event_images
event_tickets
registration_fields
registrations
registration_answers
payments
notifications
notification_logs
short_links
event_analytics
admin_users
audit_logs
```

Use:
- foreign keys
- unique constraints
- indexes
- timestamps
- proper nullable/non-nullable fields

Important unique constraints:

```text
events.slug
events.short_code
registrations.registration_code
```

Also consider composite uniqueness where required, e.g. participant/event active registration.

---

# 17. Time & Timezone

Default timezone:

```text
Asia/Jakarta
```

Store timestamps consistently, preferably UTC.

Each event stores its timezone.

When displaying event times:
- Convert to the event timezone.
- Never assume server timezone.
- Never use browser-local time as the source of truth for event status.

Event display status must be calculated consistently using event timezone-aware timestamps.

---

# 18. SEO Rules

Every published public event should have:

- unique title
- meta description
- canonical URL
- OG title
- OG description
- OG image
- Twitter/X metadata
- Schema.org Event structured data

Use semantic HTML.

Recommended hierarchy:

```text
H1
H2
H3
```

Do not create heading hierarchy only for visual styling.

---

# 19. Structured Data

Use Schema.org `Event`.

Include appropriate:
- name
- description
- startDate
- endDate
- eventStatus
- eventAttendanceMode
- location
- organizer
- offers

Only emit data that is actually supported by event data.

Do not generate fake venue, price, organizer, or schedule information.

---

# 20. Public Event Page

Public event pages should be optimized for:

- Google
- WhatsApp sharing
- Instagram traffic
- QR posters
- AI crawlers

Primary image should be usable for:
- hero
- event card
- OG image

Use optimized image formats and responsive sizing.

---

# 21. Admin Event Builder

Recommended wizard:

```text
1. Basic Information
2. Schedule & Location
3. Tickets
4. Registration Form
5. Payment
6. Theme
7. SEO & Advanced
8. Review & Publish
```

Do not make one giant form if it significantly harms maintainability or UX.

Each step should validate its own data.

Final publish should validate the complete event.

---

# 22. Draft & Publish Rules

Draft events:
- not visible publicly
- not included in sitemap
- not indexable

Published events:
- visible publicly
- eligible for sitemap
- SEO metadata active

Cancelled events:
- retain historical registration/payment data
- should not be hard-deleted

Archived events:
- retained for internal history

Prefer soft-delete/archive behavior over destructive deletion.

---

# 23. Event Duplication

When duplicating an event:

Copy:
- description
- images
- form structure
- theme
- ticket configuration

Do not copy:
- participants
- registrations
- payments
- payment proofs
- notification history

New event must receive:
- new ID
- new slug
- new short code
- draft state

---

# 24. File Uploads

Images should use object storage.

Do not store binary images in PostgreSQL.

Validate:
- MIME type
- extension
- file size
- dimensions if needed

Store only relevant metadata/URL/key in PostgreSQL.

---

# 25. Analytics

Minimum event funnel:

```text
page_view
registration_started
registration_completed
payment_started
payment_completed
```

Analytics must not block the core registration flow.

If analytics fails, registration should still work.

---

# 26. Admin Analytics

Admin may see:
- Views
- Registrations
- Conversion
- Tickets sold
- Tickets remaining
- Revenue

Analytics are informational and should not be used as authoritative payment or registration state.

---

# 27. API Rules

All API endpoints must:
- validate input
- authenticate where required
- authorize where required
- return predictable error formats
- avoid leaking sensitive data
- log meaningful server errors
- avoid returning secrets

Use pagination for potentially large lists.

Never return all participants in an unbounded query.

---

# 28. Error Handling

Use clear user-facing errors.

Example:

```text
Event Not Found

The event you're looking for doesn't exist
or is no longer available.

[Browse Events]
```

For internal errors:
- Do not expose stack traces.
- Return generic user-facing message.
- Log detailed error server-side.

---

# 29. UI Rules

Use:
- Tailwind CSS
- shadcn/ui
- accessible components

Prefer consistency over custom one-off UI.

Buttons should have clear states:
- idle
- loading
- success
- error
- disabled

Forms must show:
- validation errors
- required fields
- submission state

Avoid excessive animations.

---

# 30. Responsive Rules

Public:
- Mobile-first
- Tablet
- Desktop

Event cards:
```text
Desktop → 4 columns
Tablet  → 2 columns
Mobile  → 1 column
```

Admin:
- Desktop-first
- Responsive enough for tablet/mobile management

---

# 31. Performance Rules

Prioritize:
- Server rendering where useful
- Static/ISR for public content where appropriate
- Next/Image
- lazy-loaded galleries
- minimal JavaScript
- pagination
- indexed database queries
- caching public event data where safe

Never cache:
- private participant data
- sensitive admin data
- payment state where stale data could cause incorrect decisions

---

# 32. Environment Variables

Never hardcode secrets.

Expected variables include:

```env
DATABASE_URL=

NEXT_PUBLIC_APP_URL=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

SSO_CLIENT_ID=
SSO_CLIENT_SECRET=
SSO_ISSUER_URL=

XENDIT_SECRET_KEY=
XENDIT_WEBHOOK_TOKEN=

EMAIL_API_KEY=

WHATSAPP_API_KEY=
WHATSAPP_API_URL=

BLOB_READ_WRITE_TOKEN=

AUTH_SECRET=
```

Use Vercel Environment Variables for deployed environments.

---

# 33. Environment Separation

Support:

```text
Development
Preview
Production
```

Do not use production credentials locally.

Do not connect development to production database.

Prefer separate Neon databases/branches for environments.

---

# 34. Code Organization

Recommended:

```text
src/
├── app/
├── components/
├── db/
├── lib/
├── services/
├── hooks/
├── types/
├── validations/
└── config/
```

Business logic belongs in:
- services
- domain/lib modules

Not inside:
- page components
- presentational components

---

# 35. Component Rules

Keep components:
- small
- composable
- reusable

Avoid giant components containing:
- database calls
- payment logic
- notification logic
- authentication logic
- UI rendering
all in one file.

---

# 36. Server/Client Boundary

Default:

```text
Server Component
```

Use Client Component only when needed for:
- browser interaction
- form interactivity
- local state
- drag/drop
- sliders
- countdown
- client-only SDK

Never move an entire page to client rendering just because one small component needs interactivity.

---

# 37. Testing

At minimum test critical business logic:

- Event display status
- Ticket availability
- Ticket quota
- Duplicate registration
- Registration state transitions
- Payment state transitions
- Webhook idempotency
- Short code generation
- Slug generation
- Notification scheduling

Add integration tests for critical API/webhook flows when practical.

---

# 38. Migration Safety

Before changing schema:
1. Inspect existing schema.
2. Create migration.
3. Ensure migration is reversible/safe where practical.
4. Update application code.
5. Run typecheck.
6. Run tests.
7. Verify migration against development database.

Never drop production data casually.

---

# 39. Git & Change Discipline

Before modifying code:
- Inspect relevant files.
- Understand current architecture.
- Do not rewrite unrelated areas.

When implementing a feature:
- Make the smallest coherent change.
- Avoid unrelated refactors.
- Preserve existing functionality.

Do not delete functionality unless explicitly requested.

---

# 40. Required Checks After Significant Changes

Run:

```bash
npm run lint
npm run typecheck
npm test
```

If scripts differ, inspect `package.json` and use the repository's actual commands.

For database changes, also run the relevant migration/check command.

Fix errors rather than suppressing them.

---

# 41. Claude Code Workflow

For every task:

## Step 1 — Inspect

Read:
- `PRD.md`
- `CLAUDE.md`
- package.json
- relevant source files
- database schema
- existing routes/components

## Step 2 — Plan

Before large changes, identify:
- affected files
- data model changes
- API changes
- auth implications
- security implications

## Step 3 — Implement

Implement incrementally.

## Step 4 — Validate

Run:
- lint
- typecheck
- tests
- database migration checks

## Step 5 — Review

Check:
- security
- authorization
- mobile UI
- error states
- loading states
- accessibility
- SEO
- edge cases

## Step 6 — Report

Summarize:
- what changed
- files changed
- database changes
- environment variables needed
- tests run
- known limitations

---

# 42. Do Not Do This

Never:

- hardcode secrets
- expose server environment variables
- trust client payment status
- trust client authorization
- store raw OTP
- use production DB for development
- create unbounded participant queries
- silently swallow payment webhook errors
- ignore webhook duplicates
- use `any` everywhere
- disable TypeScript strictness
- disable lint rules to make code pass
- insert arbitrary JavaScript from admin input
- hard-delete historical payment/registration records casually
- put all business logic into React components
- build the entire application in one massive change
- invent external API behavior without checking provider documentation/configuration

---

# 43. Product Priority

Implement in this order:

## P0

- Public event listing
- Event detail
- Admin SSO
- Event CRUD
- Neon PostgreSQL
- Participant registration
- Google Login
- Ticket system
- Free events
- Short URL
- SEO

## P1

- WhatsApp OTP
- Xendit
- Manual payment
- Static QRIS
- Email notifications
- WhatsApp notifications
- Custom registration form
- Participant dashboard
- CSV export

## P2

- Analytics dashboard
- Event duplication
- Advanced tracking
- Audit log
- Multiple admin roles

## P3

- QR check-in
- Certificate
- Seating
- Advanced CRM

---

# 44. Phase Rules

Do not skip foundational work.

### Phase 1
Foundation + database + architecture.

### Phase 2
Public website.

### Phase 3
Participant registration/auth.

### Phase 4
Admin.

### Phase 5
Payment + notification.

### Phase 6
Production hardening.

Each phase should leave the project in a buildable state.

---

# 45. Critical Business Rules Summary

1. Event lifecycle, registration status, and payment status are separate.
2. Database is source of truth for inventory and payment state.
3. Xendit webhook is source of truth for Xendit payment confirmation.
4. Ticket inventory must be concurrency-safe.
5. One active participant registration per event by default.
6. Draft events are private.
7. Published events are public.
8. Cancelled events retain historical data.
9. Short codes are unique.
10. Slugs are unique.
11. Payment webhook processing is idempotent.
12. Admin authorization is always server-side.
13. Participant authentication never grants admin access.
14. Sensitive URLs/data must not be indexed.
15. Analytics failures must not break registration.

---

# 46. Definition of Done

A feature is not considered complete merely because the UI appears to work.

It is complete when:
- UI works
- Server logic works
- Validation exists
- Authorization exists where needed
- Database behavior is correct
- Error states are handled
- Loading states are handled
- Mobile behavior is acceptable
- Security implications are addressed
- Tests exist for critical business logic
- Lint passes
- Typecheck passes
- Existing functionality remains intact

