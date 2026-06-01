import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const flashcardDecksTable = pgTable("flashcard_decks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  description: text("description"),
  cardCount: integer("card_count").notNull().default(0),
  masteredCount: integer("mastered_count").notNull().default(0),
  color: text("color"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const flashcardsTable = pgTable("flashcards", {
  id: serial("id").primaryKey(),
  deckId: integer("deck_id").notNull().references(() => flashcardDecksTable.id, { onDelete: "cascade" }),
  front: text("front").notNull(),
  back: text("back").notNull(),
  difficulty: text("difficulty").notNull().default("medium"),
  reviewCount: integer("review_count").notNull().default(0),
  lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
  nextReviewAt: timestamp("next_review_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFlashcardDeckSchema = createInsertSchema(flashcardDecksTable).omit({ id: true, createdAt: true });
export type InsertFlashcardDeck = z.infer<typeof insertFlashcardDeckSchema>;
export type FlashcardDeck = typeof flashcardDecksTable.$inferSelect;

export const insertFlashcardSchema = createInsertSchema(flashcardsTable).omit({ id: true, createdAt: true });
export type InsertFlashcard = z.infer<typeof insertFlashcardSchema>;
export type Flashcard = typeof flashcardsTable.$inferSelect;
