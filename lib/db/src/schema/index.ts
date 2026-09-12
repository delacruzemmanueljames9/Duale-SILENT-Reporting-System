import { pgTable, text, boolean, timestamp, integer, uuid } from "drizzle-orm/pg-core";

export const reportsTable = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  trackingCode: text("tracking_code").notNull().unique(),
  isAnonymous: boolean("is_anonymous").notNull().default(true),
  reporterContact: text("reporter_contact"),
  description: text("description").notNull(),
  peopleInvolved: text("people_involved"),
  incidentDatetime: text("incident_datetime"),
  urgency: text("urgency").notNull(),
  status: text("status").notNull().default("new"),
  source: text("source").notNull().default("digital"),
  escalatedToPnp: boolean("escalated_to_pnp").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const caseNotesTable = pgTable("case_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  reportId: uuid("report_id").notNull().references(() => reportsTable.id, { onDelete: "cascade" }),
  authorName: text("author_name").notNull(),
  note: text("note").notNull(),
  visibleToPnp: boolean("visible_to_pnp").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const feedbackTable = pgTable("feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  comfortRating: integer("comfort_rating").notNull(),
  comments: text("comments"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const profilesTable = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  fullName: text("full_name"),
  role: text("role").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
