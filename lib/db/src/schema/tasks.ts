import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const plannerTasksTable = pgTable("planner_tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  description: text("description"),
  dueDate: text("due_date").notNull(),
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("pending"),
  estimatedMinutes: integer("estimated_minutes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const insertPlannerTaskSchema = createInsertSchema(plannerTasksTable).omit({ id: true, createdAt: true });
export type InsertPlannerTask = z.infer<typeof insertPlannerTaskSchema>;
export type PlannerTask = typeof plannerTasksTable.$inferSelect;
