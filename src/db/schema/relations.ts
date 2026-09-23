import { relations } from "drizzle-orm";
import { events } from "./events";
import { eventImages } from "./event-images";
import { eventTickets } from "./event-tickets";
import { registrationFields } from "./registration-fields";
import { registrations } from "./registrations";
import { registrationAnswers } from "./registration-answers";
import { payments } from "./payments";
import { notifications } from "./notifications";
import { shortLinks } from "./short-links";
import { eventAnalytics } from "./event-analytics";
import { users } from "./users";
import { adminUsers } from "./admin-users";
import { auditLogs } from "./audit-logs";

export const eventsRelations = relations(events, ({ many, one }) => ({
  eventImages: many(eventImages),
  eventTickets: many(eventTickets),
  registrationFields: many(registrationFields),
  registrations: many(registrations),
  shortLinks: many(shortLinks),
  eventAnalytics: many(eventAnalytics),
  createdByAdmin: one(adminUsers, {
    fields: [events.createdBy],
    references: [adminUsers.id],
  }),
}));

export const eventImagesRelations = relations(eventImages, ({ one }) => ({
  event: one(events, { fields: [eventImages.eventId], references: [events.id] }),
}));

export const eventTicketsRelations = relations(eventTickets, ({ one, many }) => ({
  event: one(events, { fields: [eventTickets.eventId], references: [events.id] }),
  registrations: many(registrations),
}));

export const registrationFieldsRelations = relations(registrationFields, ({ one, many }) => ({
  event: one(events, { fields: [registrationFields.eventId], references: [events.id] }),
  answers: many(registrationAnswers),
}));

export const registrationsRelations = relations(registrations, ({ one, many }) => ({
  event: one(events, { fields: [registrations.eventId], references: [events.id] }),
  user: one(users, { fields: [registrations.userId], references: [users.id] }),
  ticket: one(eventTickets, { fields: [registrations.ticketId], references: [eventTickets.id] }),
  answers: many(registrationAnswers),
  payments: many(payments),
  notifications: many(notifications),
}));

export const registrationAnswersRelations = relations(registrationAnswers, ({ one }) => ({
  registration: one(registrations, { fields: [registrationAnswers.registrationId], references: [registrations.id] }),
  field: one(registrationFields, { fields: [registrationAnswers.fieldId], references: [registrationFields.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  registration: one(registrations, { fields: [payments.registrationId], references: [registrations.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  registration: one(registrations, { fields: [notifications.registrationId], references: [registrations.id] }),
  event: one(events, { fields: [notifications.eventId], references: [events.id] }),
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const shortLinksRelations = relations(shortLinks, ({ one }) => ({
  event: one(events, { fields: [shortLinks.eventId], references: [events.id] }),
}));

export const eventAnalyticsRelations = relations(eventAnalytics, ({ one }) => ({
  event: one(events, { fields: [eventAnalytics.eventId], references: [events.id] }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  registrations: many(registrations),
  notifications: many(notifications),
}));

export const adminUsersRelations = relations(adminUsers, ({ many }) => ({
  createdEvents: many(events),
  auditLogs: many(auditLogs),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  admin: one(adminUsers, { fields: [auditLogs.adminId], references: [adminUsers.id] }),
}));
