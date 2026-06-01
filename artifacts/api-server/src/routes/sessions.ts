import { Router } from "express";
import { db } from "../lib/db";
import { studySessionsTable, insertStudySessionSchema } from "@workspace/db";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/sessions", async (_req, res) => {
  try {
    const rows = await db.select().from(studySessionsTable).orderBy(sql`${studySessionsTable.createdAt} DESC`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/sessions", async (req, res) => {
  try {
    const parsed = insertStudySessionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    const [row] = await db.insert(studySessionsTable).values(parsed.data).returning();
    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/sessions/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [row] = await db.update(studySessionsTable).set(req.body).where(eq(studySessionsTable.id, id)).returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/sessions/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(studySessionsTable).where(eq(studySessionsTable.id, id));
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
