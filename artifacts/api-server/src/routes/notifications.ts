import { Router } from "express";
import { db } from "../lib/db";
import { notificationsTable, insertNotificationSchema } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

router.post("/notifications", async (req, res) => {
  try {
    const parsed = insertNotificationSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request" });
    const [row] = await db.insert(notificationsTable).values(parsed.data).returning();
    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/notifications", async (_req, res) => {
  try {
    const rows = await db.select().from(notificationsTable).orderBy(sql`${notificationsTable.createdAt} DESC`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/notifications/:id/read", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [row] = await db.update(notificationsTable).set({ read: true }).where(eq(notificationsTable.id, id)).returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/notifications/read-all", async (_req, res) => {
  try {
    await db.update(notificationsTable).set({ read: true });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
