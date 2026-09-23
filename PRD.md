# PRD — AsiaCommerce Event Management Platform

**Project:** AsiaCommerce Event  
**Domain:** `event.asiacommerce.net`  
**Purpose:** Internal Event Management + Public Event Directory & Registration  
**Deployment:** Vercel  
**Database:** Neon PostgreSQL  
**Admin Authentication:** AsiaCommerce SSO (`sso.asiacommerce.net`)  
**Participant Authentication:** Google OAuth + WhatsApp OTP  
**Payment:** Xendit / Manual / Static QRIS

---

## 1. Product Overview

AsiaCommerce Event adalah platform untuk mengelola seluruh event perusahaan AsiaCommerce dari satu tempat.

Platform memiliki dua sisi:

### Public

Dapat diakses siapa saja melalui `event.asiacommerce.net`.

Pengunjung dapat:
- Melihat event yang akan datang
- Melihat event yang sedang berlangsung
- Melihat event yang sudah selesai
- Membuka detail event
- Mendaftar event
- Melakukan pembayaran
- Mendapatkan konfirmasi melalui email/WhatsApp

### Internal Admin

Diakses melalui `event.asiacommerce.net/admin`.

Admin AsiaCommerce dapat:
- Membuat event
- Mengatur tiket
- Mengatur kuota
- Mengatur formulir pendaftaran
- Mengatur pembayaran
- Mengelola peserta
- Mengelola status event
- Mengirim notifikasi
- Mengatur SEO
- Mengatur tracking/pixel

---

## 2. Goals

1. Mempermudah tim AsiaCommerce membuat dan mengelola event.
2. Menyediakan satu katalog event perusahaan.
3. Memudahkan peserta menemukan dan mendaftar event.
4. Mendukung event gratis maupun berbayar.
5. Mendukung beberapa jenis tiket dengan harga berbeda.
6. Menyediakan sistem registrasi dan pembayaran terintegrasi.
7. Menyediakan notifikasi otomatis.
8. Setiap event memiliki halaman SEO-friendly.
9. Admin tidak perlu coding ketika membuat event baru.

### Non-Goals — V1

Belum perlu:
- Seating arrangement
- Ticket scanning/QR check-in
- Certificate generator
- Loyalty/reward system
- Multi-company event marketplace
- Advanced CRM

Fitur tersebut dapat masuk roadmap berikutnya.

---

## 3. User Roles

### 3.1 Public Visitor

Tidak perlu login.

Dapat:
- Browse event
- Search event
- Filter event
- Membuka event detail
- Membagikan event
- Mendaftar event

### 3.2 Participant

Peserta event.

Authentication:
- Google
- WhatsApp Number / OTP

Dapat:
- Mendaftar event
- Melihat status pendaftaran
- Melihat status pembayaran
- Mendapatkan confirmation
- Mendapatkan reminder

### 3.3 Admin

Internal AsiaCommerce.

Authentication melalui AsiaCommerce SSO.

Dapat:
- CRUD Event
- CRUD Ticket
- CRUD Registration Form
- CRUD Participant
- Manage Payment
- Manage Notification
- Manage SEO
- Manage tracking

---

## 4. Information Architecture

```text
event.asiacommerce.net
│
├── /
│   └── Home
│
├── /events
│   └── Event Listing + Filter/Search
│
├── /events/[slug]
│   └── Event Detail
│
├── /[slug]
│   └── Event Detail canonical short public path (recommended)
│
├── /[shortCode]
│   └── Redirect → /[slug]
│
├── /login
│   ├── Google Login
│   └── WhatsApp OTP Login
│
├── /register/[eventId]
│   └── Registration Flow
│
├── /payment/[registrationId]
│   └── Payment Flow
│
└── /admin
    ├── Dashboard
    ├── Events
    │   ├── All Events
    │   ├── Create
    │   └── Edit
    ├── Participants
    ├── Payments
    ├── Notifications
    └── Settings
```

### URL Decision

Recommended public URL structure:

```text
event.asiacommerce.net/events
event.asiacommerce.net/ai-starter-pack-for-umkm
event.asiacommerce.net/8hdbkk92
```

`/events` menjadi directory, sedangkan detail event memakai root-level slug agar URL lebih pendek untuk Instagram, WhatsApp, poster, QR Code, dan SEO.

---

# 5. Public Website

## 5.1 Header

Desktop:

```text
[AsiaCommerce Event]      Home   Events          [Login]
```

Mobile:

```text
[Logo]                         [☰]
```

Menu:
- Home
- Events
- Login

Jika participant login:

```text
Home | Events | My Events | Profile
```

---

# 6. HOME

URL: `/`

## Hero

Contoh:

> Discover AsiaCommerce Events

> Join our upcoming events, workshops, webinars, and community activities.

CTA:

`Explore Events`

---

# 7. Event Sections

Homepage menampilkan event berdasarkan display status.

### Upcoming / Segera Hadir

Event yang belum dimulai.

### On Going / Sedang Berjalan

Event yang sedang berlangsung.

### Past Event / Selesai

Event yang sudah selesai.

Setiap section dapat memiliki maksimal 4 card pada desktop dan CTA `View All Events` jika jumlah event lebih banyak.

---

# 8. Event Card

Desktop menggunakan 4-column grid.

Card wajib memiliki:
- Primary image
- Status badge
- Event title
- Date
- Location
- Ticket quantity
- Price

Contoh:

```text
┌─────────────────────┐
│     EVENT IMAGE     │
├─────────────────────┤
│ UPCOMING            │
│                     │
│ AI Starter Pack     │
│ for UMKM             │
│                     │
│ 📅 20 Sep 2026      │
│ 📍 Surabaya         │
│                     │
│ 100 Tickets         │
│ Rp150.000            │
└─────────────────────┘
```

Pricing:
- Free → `FREE`
- Single price → `Rp150.000`
- Multiple ticket prices → `From Rp100.000`

Quota:
- Unlimited → `Unlimited`
- Limited → `72 / 100 tickets available`
- Sold out → `SOLD OUT`

---

# 9. `/events`

Halaman seluruh event.

### Search

`Search events...`

### Filter

- All
- Upcoming
- On Going
- Past
- Free
- Paid
- Online
- Offline

Tambahan:
- Date
- Location

### Sorting

- Upcoming date
- Newest
- Oldest

---

# 10. Event Detail

Recommended URL:

```text
/events directory → event.asiacommerce.net
Event detail       → event.asiacommerce.net/ai-starter-pack-for-umkm
Short URL          → event.asiacommerce.net/8hdbkk92
```

Example:

```text
https://event.asiacommerce.net/ai-starter-pack-for-umkm
https://event.asiacommerce.net/8hdbkk92
```

Short URL melakukan 301 redirect ke canonical event URL.

---

# 11. Event Detail Layout

```text
┌─────────────────────────────────────────────┐
│              PRIMARY IMAGE                  │
└─────────────────────────────────────────────┘

[thumbnail] [thumbnail] [thumbnail] [thumbnail]

UPCOMING

AI Starter Pack for UMKM

20 September 2026

────────────────────────

📅 Date
20 September 2026

🕐 Time
09:00 - 12:00 WIB

📍 Location
Surabaya

💰 Price
Rp150.000

────────────────────────

Countdown

02 Days 14 Hours 32 Minutes

────────────────────────

About Event

[Description]

────────────────────────

Registration

[Name]
[WhatsApp]
[Email]

[Select Ticket]

[Payment Method]

[ DAFTAR SEKARANG ]
```

Event detail wajib memiliki:
- Primary image
- Supporting image gallery
- Event status
- Title
- Description
- Date
- Time
- Location
- Cost
- Countdown
- Registration form
- Registration CTA
- Share event

---

# 12. Event Gallery

### Primary Image

Digunakan untuk:
- Hero image
- Event card
- OG image
- Social sharing

### Supporting Images

Multiple images dengan:
- Thumbnail
- Click to enlarge
- Slider
- Keyboard navigation
- Mobile swipe

---

# 13. Event Status

Gunakan event lifecycle status dan display status secara terpisah.

### Database lifecycle status

```text
draft
published
cancelled
archived
```

### Display status

Dihitung dari waktu:

```text
now < start_datetime
→ Upcoming

start_datetime <= now <= end_datetime
→ On Going

now > end_datetime
→ Past
```

`cancelled` dapat mengoverride display status.

Jangan gunakan satu field status untuk event, registration, dan payment.

---

# 14. Event Location

## Online

Admin memilih:
- Online
- Platform
- Meeting URL

Platform dapat berupa:
- Google Meet
- Zoom
- Microsoft Teams
- Other

Meeting URL dapat disembunyikan sebelum registration/confirmation.

## Offline

Admin memasukkan:
- Venue Name
- Address
- Latitude
- Longitude
- Google Maps URL

Detail event menampilkan nama venue, alamat, dan tombol `Open in Google Maps`.

---

# 15. Ticket System

Admin dapat membuat multiple ticket types.

Contoh:

```text
Early Bird
Rp100.000
1 Sep – 10 Sep

Regular
Rp150.000
11 Sep – 20 Sep
```

Atau:

```text
VIP
Rp500.000

Regular
Rp250.000

Student
Rp100.000
```

Ticket fields:

```text
id
event_id
name
description
price
currency
quota
sales_start
sales_end
is_active
created_at
updated_at
```

Ticket availability dihitung berdasarkan:
- Current datetime
- Sales start
- Sales end
- Quota
- Active state

Ticket expired atau sold out tidak dapat dipilih.

---

# 16. Event Capacity

Admin memilih:
- Unlimited
- Limited

Jika limited, admin menentukan maximum tickets.

System wajib mencegah overselling menggunakan database transaction / locking.

---

# 17. Registration Form Builder

Default fields:
- Name *
- Email *
- WhatsApp Number *

Admin dapat menambahkan:
- Text
- Number
- Date
- Dropdown
- Radio
- Checkbox
- Textarea
- File upload

Field properties:
- label
- type
- required
- placeholder
- options
- order

Admin dapat mengubah urutan field.

---

# 18. Participant Registration

Flow:

```text
Event Detail
      ↓
Daftar Sekarang
      ↓
Login / Register
      ↓
Registration Form
      ↓
Select Ticket
      ↓
Payment Method
      ↓
Review
      ↓
Submit
```

---

# 19. Payment

Platform mendukung:

1. Xendit
2. Manual Payment
3. Static QRIS

## Xendit

System membuat invoice/payment request.

Payment status:

```text
pending
paid
expired
failed
cancelled
```

Payment callback/webhook adalah source of truth.

## Manual Payment

Admin mengatur:
- Bank Name
- Account Name
- Account Number
- Payment Instructions

Participant dapat upload payment proof.

Admin dapat:
- Approve
- Reject

## Static QRIS

Admin upload QRIS image.

Participant melihat:
- QRIS
- Amount
- Instructions
- Upload payment proof

Admin melakukan verifikasi manual.

---

# 20. Registration & Payment Status

### Registration

```text
pending_payment
payment_verification
confirmed
cancelled
waitlisted
```

### Payment

```text
pending
paid
expired
failed
cancelled
```

Free event:
```text
Registration Created
→ Confirmed
```

Paid event:
```text
Registration Created
→ Pending Payment
→ Payment Confirmed
→ Registration Confirmed
```

Participant tidak boleh dianggap confirmed hanya karena menekan `Daftar Sekarang`.

---

# 21. Participant Authentication

Support:

### Google OAuth

### WhatsApp OTP

Flow:

```text
Phone Number
 ↓
Generate OTP
 ↓
Send WhatsApp
 ↓
Verify OTP
 ↓
Login
```

OTP requirements:
- Expire 5 minutes
- One-time use
- Rate limit
- Maximum attempts
- Store hash, not raw OTP

---

# 22. Participant Dashboard

URL:

`/my-events`

Menampilkan:

```text
My Events

AI Starter Pack for UMKM
Registration: Confirmed
Payment: Paid
Date: 20 Sep 2026

[View Event]
```

---

# 23. Admin SSO

Admin login menggunakan AsiaCommerce SSO.

Flow:

```text
/admin
 ↓
Check authentication
 ↓
Redirect to sso.asiacommerce.net
 ↓
SSO authentication
 ↓
Callback
 ↓
Validate token
 ↓
Create admin session
 ↓
/admin
```

Participant authentication dan admin SSO harus dipisahkan.

Jika SSO menyediakan roles, gunakan RBAC.

---

# 24. Admin Dashboard

URL:

`/admin`

Metrics:

```text
Total Events
Upcoming Events
On Going Events
Total Registrations
Confirmed Participants
Pending Payments
Total Revenue
```

Event-specific analytics:
- Views
- Registrations
- Conversion Rate
- Tickets Sold
- Tickets Remaining
- Revenue

---

# 25. Admin Navigation

```text
Dashboard

Events
  ├── All Events
  ├── Create Event

Participants

Payments

Notifications

Settings
```

---

# 26. Admin Event List

Table:

| Event | Date | Status | Participants | Revenue | Action |
|---|---|---|---:|---:|---|
| AI Starter Pack | 20 Sep | Upcoming | 72 | Rp10M | Manage |
| Webinar AI | 15 Sep | Past | 150 | Free | Manage |

Actions:
- View
- Edit
- Duplicate
- Participants
- Copy Link
- Archive

---

# 27. Create Event Wizard

### Step 1 — Basic Information

- Event Title
- Slug
- Description
- Primary Image
- Gallery

### Step 2 — Schedule & Location

- Start Date
- Start Time
- End Date
- End Time
- Timezone
- Online / Offline

Offline:
- Venue
- Address
- Google Maps
- Latitude
- Longitude

Online:
- Platform
- Meeting URL

### Step 3 — Tickets

- Free / Paid
- Ticket types
- Price
- Quota
- Sales period

### Step 4 — Registration Form

- Default fields
- Custom fields

### Step 5 — Payment

- Xendit
- Manual
- Static QRIS

### Step 6 — Theme

- Clean
- Corporate
- Custom Color

### Step 7 — SEO & Advanced

- SEO title
- SEO description
- OG image
- Google Analytics ID
- Meta Pixel ID
- GTM ID

### Step 8 — Review & Publish

Actions:
- Preview
- Save Draft
- Publish Event

---

# 28. Event Theme

V1:
- Clean
- Corporate
- Custom Color

Custom design menggunakan design tokens:

```text
primaryColor
secondaryColor
backgroundColor
textColor
```

Theme tidak boleh mengharuskan perubahan component.

---

# 29. SEO

Setiap public event page wajib memiliki:
- SEO title
- Meta description
- Canonical URL
- OG title
- OG description
- OG image
- Twitter/X metadata
- Robots metadata
- Sitemap inclusion
- Structured data

---

# 30. Event Structured Data

Gunakan Schema.org `Event`.

Data minimal:
- name
- startDate
- endDate
- eventStatus
- eventAttendanceMode
- location
- organizer
- offers jika berbayar

Online event menggunakan `OnlineEventAttendanceMode`.

Offline event menggunakan `OfflineEventAttendanceMode`.

Hybrid dapat disiapkan untuk future version.

---

# 31. GEO / AI Search Optimization

Event page harus mudah dipahami search engine dan AI crawler.

Gunakan:
- Semantic HTML
- Structured data
- Clear headings
- Event entity information
- Date/time
- Location
- Organizer
- Price
- Registration URL
- FAQ structured data jika tersedia

Contoh struktur:

```text
H1: AI Starter Pack for UMKM

When:
20 September 2026

Where:
Surabaya

Organizer:
AsiaCommerce

Price:
Rp150.000
```

---

# 32. Short URL

Format:

```text
event.asiacommerce.net/8hdbkk92
```

Regex:

```text
[a-z0-9]{8}
```

Database:

```text
short_code
event_id
```

Redirect:
- HTTP 301
- Canonical event URL

Short code harus unique.

Jika event unpublished/deleted, jangan redirect ke event yang tidak dapat diakses. Tampilkan unavailable/404 sesuai lifecycle.

---

# 33. Analytics

Minimal:
- Page Views
- Unique Visitors
- Registration Started
- Registration Completed
- Payment Started
- Payment Completed

Conversion funnel:

```text
Views
 ↓
Registration
 ↓
Payment
```

---

# 34. Advanced Tracking

Admin dapat memasukkan:
- Google Analytics ID
- Meta Pixel ID
- Google Tag Manager ID

V1 jangan memberikan arbitrary JavaScript injection.

Custom script jika dibutuhkan di masa depan harus melalui sanitization/security review.

---

# 35. Notification System

Notification types:
- Registration Confirmation
- Payment Confirmation
- H-1 Reminder
- Hari-H Reminder

Channels:
- Email
- WhatsApp

Notification architecture harus menggunakan service abstraction dan job/scheduled processing.

Contoh:

```text
Registration Created
 ↓
Create Notification Job
 ↓
Email / WhatsApp
```

Reminder:

```text
Event starts - 1 day
 ↓
Find confirmed participants
 ↓
Create notification jobs
 ↓
Send
```

Untuk V1 dapat menggunakan Vercel Cron / scheduled jobs atau worker yang sesuai dengan kebutuhan reliability.

---

# 36. Notification Provider Abstraction

Gunakan interface:

```ts
sendEmail(...)
sendWhatsAppMessage(...)
```

Provider tidak boleh di-hardcode ke registration business logic.

Tujuan:
- Provider dapat diganti
- Testing lebih mudah
- Retry lebih mudah
- Error handling terpusat

---

# 37. Database Architecture

Database: Neon PostgreSQL.

ORM: Drizzle ORM.

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

---

# 38. `users`

```text
id
name
email
phone
avatar_url
auth_provider
auth_provider_id
created_at
updated_at
```

Unique:
- email
- phone
- provider + provider_id

---

# 39. `events`

```text
id
title
slug
short_code

description
primary_image_url

start_datetime
end_datetime
timezone

attendance_mode
venue_name
venue_address
latitude
longitude
google_maps_url

online_platform
meeting_url

lifecycle_status

theme
theme_config

seo_title
seo_description
og_image_url

analytics_config

created_by
created_at
updated_at
published_at
```

---

# 40. `event_images`

```text
id
event_id
image_url
alt_text
sort_order
created_at
```

---

# 41. `event_tickets`

```text
id
event_id
name
description
price
currency
quota
sales_start
sales_end
is_active
created_at
updated_at
```

---

# 42. `registration_fields`

```text
id
event_id
field_key
label
type
required
placeholder
options_json
sort_order
created_at
updated_at
```

---

# 43. `registrations`

```text
id
event_id
user_id
ticket_id
registration_code

name
email
phone

status
payment_status

registered_at
confirmed_at

created_at
updated_at
```

Registration code format:

```text
AC-2026-XXXXXX
```

---

# 44. `registration_answers`

```text
id
registration_id
field_id
value
```

---

# 45. `payments`

```text
id
registration_id
provider
amount
currency
status
external_payment_id
external_invoice_url
payment_proof_url
paid_at
verified_at
verified_by
created_at
updated_at
```

---

# 46. `notifications`

```text
id
registration_id
event_id
user_id
channel
type
status
scheduled_at
sent_at
provider_message_id
error_message
created_at
```

Types:

```text
registration_confirmation
payment_confirmation
event_reminder_1d
event_day
```

---

# 47. Authentication & Authorization

Participant auth:
- Google OAuth
- WhatsApp OTP

Admin auth:
- AsiaCommerce SSO

Admin authorization:
- RBAC

Recommended roles:

```text
SUPER_ADMIN
EVENT_ADMIN
```

SUPER_ADMIN:
- Manage admins
- Manage events
- Manage participants
- Manage payments
- Settings

EVENT_ADMIN:
- Manage events
- Manage participants
- Manage payments

---

# 48. Security Requirements

Wajib:
- HTTPS
- Secure cookies
- CSRF protection where applicable
- Rate limiting
- OTP rate limiting
- Input validation
- SQL injection protection
- XSS protection
- Authorization middleware
- Admin route protection
- Signed webhook verification
- Payment webhook idempotency
- File upload validation
- Image size limits
- Audit log
- Secret management via environment variables

---

# 49. Payment Security

Jangan menganggap success redirect sebagai bukti pembayaran.

Source of truth:

```text
Payment Provider Webhook
```

Flow:

```text
Xendit
 ↓
Webhook
 ↓
Verify Signature / Token
 ↓
Validate Payment
 ↓
Database Transaction
 ↓
Payment = PAID
 ↓
Registration = CONFIRMED
 ↓
Notification
```

Webhook harus idempotent.

---

# 50. File Storage

Jangan menyimpan binary image di PostgreSQL.

Gunakan object storage seperti:
- Vercel Blob
- S3-compatible storage
- Provider lain yang sesuai

Database hanya menyimpan URL/key dan metadata.

---

# 51. Recommended Tech Stack

```text
Frontend:
Next.js + App Router

Language:
TypeScript

Styling:
Tailwind CSS

UI:
shadcn/ui

Backend:
Next.js server-side code / Route Handlers / Server Actions where appropriate

ORM:
Drizzle ORM

Database:
Neon PostgreSQL

Validation:
Zod

Forms:
React Hook Form

Deployment:
Vercel

Object Storage:
Vercel Blob or S3-compatible storage

Authentication:
Auth.js / custom SSO integration as required

Payment:
Xendit API

Email:
Provider abstraction

WhatsApp:
Provider abstraction

Analytics:
GA4 + internal event analytics
```

---

# 52. Recommended Project Structure

```text
src/
├── app/
│   ├── (public)/
│   ├── admin/
│   ├── login/
│   ├── register/
│   ├── payment/
│   └── api/
│
├── components/
│   ├── ui/
│   ├── events/
│   ├── registration/
│   └── admin/
│
├── db/
│   ├── schema/
│   ├── migrations/
│   └── index.ts
│
├── lib/
│   ├── auth/
│   ├── events/
│   ├── registration/
│   ├── payments/
│   ├── notifications/
│   ├── analytics/
│   ├── seo/
│   └── storage/
│
├── services/
│   ├── payment/
│   ├── email/
│   └── whatsapp/
│
├── hooks/
├── types/
├── validations/
└── config/
```

---

# 53. API Design

```text
GET    /api/events
GET    /api/events/:id

POST   /api/events
PATCH  /api/events/:id
DELETE /api/events/:id

GET    /api/events/:id/participants

POST   /api/registrations
GET    /api/registrations/:id

POST   /api/payments/create
POST   /api/payments/upload-proof

POST   /api/webhooks/xendit

POST   /api/notifications/send
```

Prefer Server Actions for internal mutations where appropriate, but keep webhook endpoints as HTTP endpoints.

---

# 54. Admin Participant Management

Admin dapat:
- Search participant
- Filter event
- Filter ticket
- Filter payment status
- Filter registration status
- View participant detail
- Edit participant
- Change registration status
- Verify payment
- Resend confirmation
- Export CSV

CSV columns:
- Registration Code
- Name
- Email
- WhatsApp
- Ticket
- Price
- Payment Status
- Registration Status
- Registered At

---

# 55. Event Duplication

Admin dapat duplicate event.

Yang ikut:
- Description
- Images
- Form
- Theme
- Ticket configuration

Yang tidak ikut:
- Participants
- Payment data
- Registration data
- Payment proof

Event baru:
- Draft
- Date harus diatur ulang
- Slug baru
- Short code baru

---

# 56. Event Preview

Admin dapat preview event sebelum publish.

Preview:
- Tidak masuk sitemap
- Tidak di-index
- Hanya dapat diakses oleh admin/authorized preview token

---

# 57. Empty States

Homepage:

> No upcoming events at the moment.

Events:

> No events found.

Admin:

> You haven't created any events yet.

---

# 58. Error States

Event not found:

```text
Event Not Found

The event you're looking for doesn't exist
or is no longer available.

[Browse Events]
```

Registration closed:

```text
Registration Closed

Registration for this event is no longer available.
```

Sold out:

```text
Sold Out
```

---

# 59. Responsive Design

Desktop:
- 4 cards

Tablet:
- 2 cards

Mobile:
- 1 card

Event detail harus mobile-first karena kemungkinan besar traffic berasal dari WhatsApp, Instagram, dan QR code.

Admin desktop-first tetapi responsive.

---

# 60. Performance

Target:
- Fast initial load
- Image optimization
- Lazy-load gallery
- Server-side rendering / static generation untuk public event pages jika memungkinkan
- Database pagination
- Minimal client-side fetching
- Optimized fonts/assets

Public event pages harus cepat karena berfungsi sebagai landing page dari social media, WhatsApp, Google, AI search, dan QR posters.

---

# 61. Caching

Public:
- `/`
- `/events`
- `/[slug]`

Gunakan Next.js caching/ISR bila sesuai.

Admin:
- Dynamic / no-store bila membutuhkan data real-time.

Payment:
- Jangan cache data status pembayaran.

---

# 62. Sitemap & Robots

Sitemap:

```text
/sitemap.xml
```

Masukkan:
- Homepage
- `/events`
- Published public event pages

Jangan masukkan:
- `/admin`
- `/login`
- `/register`
- `/payment`
- Preview pages

---

# 63. Open Graph

Setiap event memiliki OG image dari primary event image, dengan fallback default AsiaCommerce Event image jika primary image tidak tersedia.

---

# 64. Social Sharing

Event detail:
- WhatsApp
- Copy Link
- Facebook
- X
- LinkedIn

---

# 65. Audit Log

Admin action penting dicatat:

```text
admin
action
entity
entity_id
before
after
timestamp
ip
```

Contoh:
- CREATE_EVENT
- UPDATE_EVENT
- PUBLISH_EVENT
- CANCEL_EVENT
- VERIFY_PAYMENT
- CHANGE_REGISTRATION_STATUS

---

# 66. Timezone

Karena event dapat berlangsung di Indonesia maupun lokasi lain, setiap event menyimpan timezone.

Default:
`Asia/Jakarta`

Semua timestamp database disimpan secara konsisten (disarankan UTC), lalu ditampilkan menggunakan timezone event.

---

# 67. Important Business Rules

1. Slug event harus unique.
2. Short code harus unique.
3. Event unpublished tidak boleh tampil di public listing.
4. Draft event tidak boleh di-index.
5. Ticket expired tidak dapat dibeli.
6. Ticket sold out tidak dapat dibeli.
7. Ticket quota tidak boleh oversell.
8. Payment status tidak boleh ditentukan dari client.
9. Webhook payment harus idempotent.
10. Registration harus memiliki unique registration code.
11. Participant dapat memiliki beberapa registration untuk event berbeda.
12. Sistem harus menentukan apakah satu participant boleh mendaftar event yang sama lebih dari sekali. Default V1: satu registration aktif per participant per event.
13. Event yang sudah memiliki participant tidak boleh dihapus secara hard-delete tanpa prosedur khusus. Gunakan archive/soft delete.
14. Event cancellation tidak boleh menghapus historical registration/payment.
15. Short URL harus tetap aman dari collision.
16. Public canonical URL harus konsisten.
17. Meeting URL dapat disembunyikan sampai registration confirmed jika admin mengaktifkan opsi tersebut.

---

# 68. Environment Variables

Contoh:

```env
DATABASE_URL=

NEXT_PUBLIC_APP_URL=https://event.asiacommerce.net

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

`.env` tidak boleh di-commit.

---

# 69. Vercel Architecture

```text
                   Internet
                       │
                       ▼
             event.asiacommerce.net
                       │
                     Vercel
                       │
             ┌─────────┴─────────┐
             │                   │
         Next.js             API Routes
             │                   │
             └─────────┬─────────┘
                       │
                  Drizzle ORM
                       │
                       ▼
                 Neon PostgreSQL
```

External services:
- Google OAuth
- AsiaCommerce SSO
- Xendit
- Email Provider
- WhatsApp Provider
- Object Storage

---

# 70. Environment Separation

Gunakan environment:
- Development
- Preview
- Production

Idealnya database juga dipisahkan:

```text
Development → Neon Development DB
Preview     → Neon Preview DB / isolated branch
Production  → Neon Production DB
```

Jangan menggunakan production database untuk local development.

---

# 71. Database Migration

Schema harus menggunakan migrations.

Contoh:

```bash
npm run db:generate
npm run db:migrate
```

Jangan membuat perubahan production database secara manual jika perubahan dapat direpresentasikan melalui migration.

---

# 72. Logging & Monitoring

Minimal monitor:
- Server errors
- Payment webhook failures
- Notification failures
- Authentication failures
- Registration errors

Gunakan error monitoring seperti Sentry atau service sejenis jika dibutuhkan.

---

# 73. Development Phases

## Phase 1 — Foundation

- Next.js
- TypeScript
- Tailwind
- shadcn/ui
- Drizzle
- Neon
- Database migrations
- Authentication architecture
- Vercel
- Environment configuration

## Phase 2 — Public Website

- Home
- Events
- Event Card
- Event Detail
- Gallery
- SEO
- OG
- Structured Data
- Short URL

## Phase 3 — Participant

- Google Login
- WhatsApp OTP
- Registration
- Custom Form
- Participant Dashboard

## Phase 4 — Admin

- SSO
- Dashboard
- Event CRUD
- Ticket Builder
- Form Builder
- Participant Management

## Phase 5 — Payment & Notification

- Xendit
- Manual Payment
- Static QRIS
- Payment Webhook
- Email
- WhatsApp
- H-1
- Hari-H

## Phase 6 — Production Hardening

- Security
- Rate limiting
- Audit logs
- Analytics
- Monitoring
- Performance
- SEO
- Automated tests

---

# 74. Priority

| Priority | Feature |
|---|---|
| P0 | Public event listing |
| P0 | Event detail |
| P0 | Admin SSO |
| P0 | Event CRUD |
| P0 | Neon PostgreSQL |
| P0 | Participant registration |
| P0 | Google Login |
| P0 | Ticket system |
| P0 | Free event |
| P0 | Short URL |
| P0 | SEO |
| P1 | WhatsApp OTP |
| P1 | Xendit |
| P1 | Manual payment |
| P1 | QRIS |
| P1 | Email notification |
| P1 | WhatsApp notification |
| P1 | Custom registration form |
| P1 | Participant dashboard |
| P1 | CSV export |
| P2 | Analytics dashboard |
| P2 | Event duplication |
| P2 | Advanced tracking |
| P2 | Audit log |
| P2 | Multiple admin roles |
| P3 | QR check-in |
| P3 | Certificate |
| P3 | Seating |
| P3 | Advanced CRM |

---

# 75. Acceptance Criteria

## Public
- [ ] Homepage dapat diakses tanpa login
- [ ] Event terbagi Upcoming / On Going / Past
- [ ] Event card menampilkan informasi utama
- [ ] `/events` menampilkan semua published events
- [ ] Search berfungsi
- [ ] Filter berfungsi
- [ ] Event detail SEO-friendly
- [ ] Gallery berfungsi
- [ ] Countdown berfungsi
- [ ] Short URL redirect berfungsi
- [ ] Social sharing berfungsi
- [ ] Responsive mobile/tablet/desktop

## Participant
- [ ] Google login
- [ ] WhatsApp OTP
- [ ] Registration form
- [ ] Custom fields
- [ ] Ticket selection
- [ ] Free registration
- [ ] Paid registration
- [ ] Registration status
- [ ] Payment status
- [ ] Confirmation notification
- [ ] H-1 reminder
- [ ] Hari-H reminder
- [ ] Participant dashboard

## Admin
- [ ] SSO login
- [ ] Dashboard
- [ ] Create event
- [ ] Edit event
- [ ] Publish event
- [ ] Duplicate event
- [ ] Ticket management
- [ ] Form builder
- [ ] Payment settings
- [ ] Theme
- [ ] SEO
- [ ] Participant management
- [ ] Payment verification
- [ ] CSV export
- [ ] Audit log

## Infrastructure
- [ ] Neon PostgreSQL
- [ ] Vercel deployment
- [ ] Environment variables
- [ ] Database migrations
- [ ] Secure authentication
- [ ] Payment webhook
- [ ] Notification scheduling
- [ ] Error monitoring
- [ ] Rate limiting
- [ ] Backup/recovery strategy

---

# 76. Definition of Done

Public user:

```text
Visitor
   ↓
Browse Event
   ↓
Open Event
   ↓
Register
   ↓
Login
   ↓
Fill Form
   ↓
Select Ticket
   ↓
Payment
   ↓
Confirmation
   ↓
Reminder
   ↓
Attend Event
```

Admin:

```text
Admin SSO
   ↓
Create Event
   ↓
Configure Ticket
   ↓
Configure Form
   ↓
Configure Payment
   ↓
Publish
   ↓
Share URL
   ↓
Monitor Participants
   ↓
Verify Payment
   ↓
Send Notification
```

---

# 77. Critical Architecture Decision

Pisahkan:

```text
Event Lifecycle Status
Registration Status
Payment Status
```

Contoh:

```text
EVENT
lifecycle_status = published
display_status = upcoming

PARTICIPANT A
registration_status = confirmed
payment_status = paid

PARTICIPANT B
registration_status = pending_payment
payment_status = pending

PARTICIPANT C
registration_status = cancelled
payment_status = cancelled
```

Jangan membuat satu `status` field untuk semuanya.

---

# 78. Claude Code Implementation Principle

PRD ini adalah product specification. Implementasikan secara incremental berdasarkan Phase.

Jangan membangun seluruh platform dalam satu perubahan besar.

Setiap phase harus:
1. Memeriksa struktur project saat ini.
2. Memahami schema dan dependency yang sudah ada.
3. Mengimplementasikan feature secara modular.
4. Menjalankan lint.
5. Menjalankan typecheck.
6. Menjalankan tests untuk business logic kritis.
7. Memastikan tidak merusak fitur existing.
8. Memberikan ringkasan perubahan dan file yang berubah.

