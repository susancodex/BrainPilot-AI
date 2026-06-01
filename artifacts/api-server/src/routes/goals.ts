import { Router } from "express";
import { db } from "../lib/db";
import { goalsTable, insertGoalSchema } from "@workspace/db";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/goals", async (_req, res) => {
  try {
    const rows = await db.select().from(goalsTable).orderBy(sql`${goalsTable.createdAt} DESC`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/goals", async (req, res) => {
  try {
    const parsed = insertGoalSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    const [row] = await db.insert(goalsTable).values(parsed.data).returning();
    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/goals/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [row] = await db.update(goalsTable).set(req.body).where(eq(goalsTable.id, id)).returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/goals/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(goalsTable).where(eq(goalsTable.id, id));
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
