import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const pdfDocumentsTable = pgTable("pdf_documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  filename: text("filename").notNull(),
  pageCount: integer("page_count").notNull().default(1),
  subject: text("subject"),
  notes: text("notes"),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPdfDocumentSchema = createInsertSchema(pdfDocumentsTable).omit({ id: true, uploadedAt: true });
export type InsertPdfDocument = z.infer<typeof insertPdfDocumentSchema>;
export type PdfDocument = typeof pdfDocumentsTable.$inferSelect;
