import { Router } from "express";
import { db } from "../lib/db";
import { pdfDocumentsTable, insertPdfDocumentSchema } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

router.get("/pdfs", async (_req, res) => {
  try {
    const rows = await db.select().from(pdfDocumentsTable).orderBy(sql`${pdfDocumentsTable.uploadedAt} DESC`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/pdfs", async (req, res) => {
  try {
    const parsed = insertPdfDocumentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    const [row] = await db.insert(pdfDocumentsTable).values(parsed.data).returning();
    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/pdfs/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(pdfDocumentsTable).where(eq(pdfDocumentsTable.id, id));
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
