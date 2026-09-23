export type EventLifecycleStatus = "draft" | "published" | "cancelled" | "archived";

export type EventDisplayStatus = "upcoming" | "ongoing" | "past" | "cancelled";

export type RegistrationStatus =
  | "pending_payment"
  | "payment_verification"
  | "confirmed"
  | "cancelled"
  | "waitlisted";

export type PaymentStatus = "pending" | "paid" | "expired" | "failed" | "cancelled";

export type PaymentProvider = "xendit" | "manual" | "qris";

export type EventAttendanceMode = "online" | "offline" | "hybrid";

export type OnlinePlatform = "google_meet" | "zoom" | "microsoft_teams" | "other";

export type NotificationType =
  | "registration_confirmation"
  | "payment_confirmation"
  | "event_reminder_1d"
  | "event_day";

export type NotificationChannel = "email" | "whatsapp";

export type NotificationStatus = "pending" | "sent" | "failed" | "cancelled";

export type AdminRole = "SUPER_ADMIN" | "EVENT_ADMIN";

export type RegistrationFieldType =
  | "text"
  | "number"
  | "date"
  | "dropdown"
  | "radio"
  | "checkbox"
  | "textarea"
  | "file";

export type AuditAction =
  | "CREATE_EVENT"
  | "UPDATE_EVENT"
  | "PUBLISH_EVENT"
  | "CANCEL_EVENT"
  | "ARCHIVE_EVENT"
  | "DUPLICATE_EVENT"
  | "CREATE_TICKET"
  | "UPDATE_TICKET"
  | "VERIFY_PAYMENT"
  | "REJECT_PAYMENT"
  | "CHANGE_REGISTRATION_STATUS"
  | "RESEND_NOTIFICATION"
  | "EXPORT_PARTICIPANTS";
