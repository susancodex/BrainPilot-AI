import { Router } from "express";
import { db } from "../lib/db";
import { revisionTopicsTable, insertRevisionTopicSchema } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

function calculateNextReview(confidenceLevel: number): Date {
  // Spaced repetition intervals by confidence (days)
  const intervals: Record<number, number> = { 1: 1, 2: 2, 3: 4, 4: 7, 5: 14 };
  const days = intervals[confidenceLevel] ?? 3;
  const next = new Date();
  next.setDate(next.getDate() + days);
  return next;
}

const router = Router();

router.get("/revisions", async (_req, res) => {
  try {
    const rows = await db.select().from(revisionTopicsTable).orderBy(sql`${revisionTopicsTable.nextReviewAt} ASC`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/revisions", async (req, res) => {
  try {
    const parsed = insertRevisionTopicSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    const nextReviewAt = calculateNextReview(parsed.data.confidenceLevel ?? 3);
    const [row] = await db.insert(revisionTopicsTable).values({ ...parsed.data, nextReviewAt }).returning();
    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/revisions/:id/review", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { confidenceLevel } = req.body as { confidenceLevel: number };
    const nextReviewAt = calculateNextReview(confidenceLevel);
    const [row] = await db.update(revisionTopicsTable)
      .set({ confidenceLevel, lastReviewedAt: new Date(), nextReviewAt, reviewCount: sql`${revisionTopicsTable.reviewCount} + 1` })
      .where(eq(revisionTopicsTable.id, id))
      .returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/revisions/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(revisionTopicsTable).where(eq(revisionTopicsTable.id, id));
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
