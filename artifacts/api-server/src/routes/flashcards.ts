import { Router } from "express";
import { db } from "../lib/db";
import { flashcardDecksTable, flashcardsTable, insertFlashcardDeckSchema, insertFlashcardSchema } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

router.get("/flashcard-decks", async (_req, res) => {
  try {
    const rows = await db.select().from(flashcardDecksTable).orderBy(sql`${flashcardDecksTable.createdAt} DESC`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/flashcard-decks", async (req, res) => {
  try {
    const parsed = insertFlashcardDeckSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    const [row] = await db.insert(flashcardDecksTable).values(parsed.data).returning();
    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/flashcard-decks/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [deck] = await db.select().from(flashcardDecksTable).where(eq(flashcardDecksTable.id, id));
    if (!deck) return res.status(404).json({ error: "Not found" });
    const cards = await db.select().from(flashcardsTable).where(eq(flashcardsTable.deckId, id));
    res.json({ ...deck, cards });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/flashcard-decks/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(flashcardDecksTable).where(eq(flashcardDecksTable.id, id));
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/flashcard-decks/:deckId/cards", async (req, res) => {
  try {
    const deckId = Number(req.params.deckId);
    const parsed = insertFlashcardSchema.safeParse({ ...req.body, deckId });
    if (!parsed.success) return res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    const [card] = await db.insert(flashcardsTable).values(parsed.data).returning();
    await db.update(flashcardDecksTable).set({ cardCount: sql`${flashcardDecksTable.cardCount} + 1` }).where(eq(flashcardDecksTable.id, deckId));
    res.status(201).json(card);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/flashcard-decks/:deckId/cards/:cardId", async (req, res) => {
  try {
    const cardId = Number(req.params.cardId);
    const deckId = Number(req.params.deckId);
    const wasMastered = req.body.difficulty === "easy";
    const [card] = await db.update(flashcardsTable).set(req.body).where(eq(flashcardsTable.id, cardId)).returning();
    if (!card) return res.status(404).json({ error: "Not found" });
    if (wasMastered) {
      await db.update(flashcardDecksTable).set({ masteredCount: sql`${flashcardDecksTable.masteredCount} + 1` }).where(eq(flashcardDecksTable.id, deckId));
    }
    res.json(card);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/flashcard-decks/:deckId/cards/:cardId", async (req, res) => {
  try {
    const cardId = Number(req.params.cardId);
    const deckId = Number(req.params.deckId);
    await db.delete(flashcardsTable).where(eq(flashcardsTable.id, cardId));
    await db.update(flashcardDecksTable).set({ cardCount: sql`GREATEST(${flashcardDecksTable.cardCount} - 1, 0)` }).where(eq(flashcardDecksTable.id, deckId));
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
