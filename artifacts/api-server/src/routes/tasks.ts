import { Router } from "express";
import { db } from "../lib/db";
import { plannerTasksTable, insertPlannerTaskSchema } from "@workspace/db";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/tasks", async (_req, res) => {
  try {
    const rows = await db.select().from(plannerTasksTable).orderBy(sql`${plannerTasksTable.createdAt} DESC`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/tasks", async (req, res) => {
  try {
    const parsed = insertPlannerTaskSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    const [row] = await db.insert(plannerTasksTable).values(parsed.data).returning();
    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/tasks/:id/complete", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [row] = await db.update(plannerTasksTable).set({ status: "completed", completedAt: new Date() }).where(eq(plannerTasksTable.id, id)).returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/tasks/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(plannerTasksTable).where(eq(plannerTasksTable.id, id));
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
