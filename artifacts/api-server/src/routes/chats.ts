import { Router } from "express";
import { db } from "../lib/db";
import { chatsTable, chatMessagesTable, insertChatSchema } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

const AI_RESPONSES: Record<string, string[]> = {
  study: [
    "Great question! Let me break this down for you step by step.",
    "That's an important concept. Here's how I'd explain it:",
    "Let's explore this topic together. The key things to understand are:",
    "I can help you understand that. First, let's establish the fundamentals:",
    "Excellent question! This is a common area of confusion. Here's the clarity you need:",
  ],
  tutor: [
    "As your AI tutor, let me guide you through this concept methodically.",
    "To master this, we need to understand the underlying principles:",
    "Let me explain this in a way that builds on what you already know:",
    "This is a rich topic. Let's approach it from multiple angles:",
    "Excellent! Let's dive deep into this subject:",
  ],
  coach: [
    "Good recall! Let's test your understanding further:",
    "That's correct! Now let's consolidate this with a follow-up question:",
    "Let me help you revise this effectively:",
    "For revision, the key points to remember are:",
    "Let's use active recall to strengthen your memory of this:",
  ],
};

function getAiResponse(mode: string, userMessage: string): string {
  const responses = AI_RESPONSES[mode] ?? AI_RESPONSES.study;
  const base = responses[Math.floor(Math.random() * responses.length)];
  const topics = ["photosynthesis", "calculus", "history", "chemistry", "physics"];
  const detected = topics.find(t => userMessage.toLowerCase().includes(t));
  if (detected) {
    return `${base}\n\nRegarding ${detected}: This is a fundamental topic in your studies. Key points to understand include the core mechanisms, the relationship between inputs and outputs, and how this connects to broader concepts in the subject. Would you like me to elaborate on any specific aspect?`;
  }
  return `${base}\n\nYour question touches on an important area of study. The core principle here is to break complex topics into manageable parts, understand each component, and then see how they connect. Practice and active recall are essential for mastery. What specific aspect would you like to explore further?`;
}

router.get("/chats", async (_req, res) => {
  try {
    const rows = await db.select().from(chatsTable).orderBy(sql`${chatsTable.createdAt} DESC`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/chats", async (req, res) => {
  try {
    const parsed = insertChatSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    const [row] = await db.insert(chatsTable).values(parsed.data).returning();
    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/chats/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [chat] = await db.select().from(chatsTable).where(eq(chatsTable.id, id));
    if (!chat) return res.status(404).json({ error: "Not found" });
    const messages = await db.select().from(chatMessagesTable).where(eq(chatMessagesTable.chatId, id)).orderBy(sql`${chatMessagesTable.createdAt} ASC`);
    res.json({ ...chat, messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/chats/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(chatsTable).where(eq(chatsTable.id, id));
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/chats/:id/messages", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { content } = req.body as { content: string };
    if (!content?.trim()) return res.status(400).json({ error: "Message content required" });
    const [chat] = await db.select().from(chatsTable).where(eq(chatsTable.id, id));
    if (!chat) return res.status(404).json({ error: "Chat not found" });

    const [userMsg] = await db.insert(chatMessagesTable).values({ chatId: id, role: "user", content }).returning();

    // Simulate AI response
    await new Promise(r => setTimeout(r, 600));
    const aiContent = getAiResponse(chat.mode, content);
    const [aiMsg] = await db.insert(chatMessagesTable).values({ chatId: id, role: "assistant", content: aiContent }).returning();

    await db.update(chatsTable).set({ messageCount: sql`${chatsTable.messageCount} + 2`, lastMessageAt: new Date() }).where(eq(chatsTable.id, id));
    const messages = await db.select().from(chatMessagesTable).where(eq(chatMessagesTable.chatId, id)).orderBy(sql`${chatMessagesTable.createdAt} ASC`);
    const [updated] = await db.select().from(chatsTable).where(eq(chatsTable.id, id));
    res.json({ ...updated, messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
