import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const revisionTopicsTable = pgTable("revision_topics", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  notes: text("notes"),
  confidenceLevel: integer("confidence_level").notNull().default(3),
  reviewCount: integer("review_count").notNull().default(0),
  lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
  nextReviewAt: timestamp("next_review_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRevisionTopicSchema = createInsertSchema(revisionTopicsTable).omit({ id: true, createdAt: true });
export type InsertRevisionTopic = z.infer<typeof insertRevisionTopicSchema>;
export type RevisionTopic = typeof revisionTopicsTable.$inferSelect;
