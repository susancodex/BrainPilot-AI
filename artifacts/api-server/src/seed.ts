import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@workspace/db";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function seed() {
  console.log("Seeding database...");

  // Study sessions
  const sessions = [
    { subject: "Biology", topic: "Cell division", durationMinutes: 90, status: "completed" },
    { subject: "Mathematics", topic: "Integral calculus", durationMinutes: 60, status: "completed" },
    { subject: "Chemistry", topic: "Organic reactions", durationMinutes: 45, status: "completed" },
    { subject: "Physics", topic: "Electromagnetism", durationMinutes: 75, status: "completed" },
    { subject: "History", topic: "WWI causes", durationMinutes: 30, status: "completed" },
    { subject: "Biology", topic: "Photosynthesis", durationMinutes: 50, status: "completed" },
  ];
  for (const s of sessions) {
    try { await db.insert(schema.studySessionsTable).values(s); } catch (_) {}
  }

  // Goals
  const goals = [
    { title: "Master cell biology", subject: "Biology", description: "Complete all chapters on cell structure and function", targetDate: "2026-07-15", progressPercent: 65, status: "active" },
    { title: "Ace calculus midterm", subject: "Mathematics", description: "Score 85%+ on the integration exam", targetDate: "2026-06-20", progressPercent: 40, status: "active" },
    { title: "Complete chemistry lab reports", subject: "Chemistry", description: "Finish all 8 lab reports on time", targetDate: "2026-06-30", progressPercent: 100, status: "completed" },
    { title: "Read history textbook", subject: "History", description: "Chapters 1-12 on Modern European History", targetDate: "2026-07-01", progressPercent: 25, status: "active" },
  ];
  for (const g of goals) {
    try { await db.insert(schema.goalsTable).values(g); } catch (_) {}
  }

  // Tasks
  const tasks = [
    { title: "Complete biology essay", subject: "Biology", dueDate: "2026-06-05", priority: "high", status: "pending", estimatedMinutes: 120 },
    { title: "Practice calculus problems", subject: "Mathematics", dueDate: "2026-06-04", priority: "high", status: "pending", estimatedMinutes: 90 },
    { title: "Review chemistry notes", subject: "Chemistry", dueDate: "2026-06-07", priority: "medium", status: "pending", estimatedMinutes: 60 },
    { title: "Read history chapter 5", subject: "History", dueDate: "2026-06-10", priority: "low", status: "pending", estimatedMinutes: 45 },
    { title: "Physics problem set 3", subject: "Physics", dueDate: "2026-06-06", priority: "medium", status: "completed", estimatedMinutes: 80 },
  ];
  for (const t of tasks) {
    try { await db.insert(schema.plannerTasksTable).values(t); } catch (_) {}
  }

  // Flashcard decks
  const [deck1] = await db.insert(schema.flashcardDecksTable).values({ title: "Cell Biology Fundamentals", subject: "Biology", description: "Core concepts of cell structure and function", cardCount: 0, masteredCount: 0, color: "bg-emerald-500" }).returning().catch(() => [null]);
  const [deck2] = await db.insert(schema.flashcardDecksTable).values({ title: "Calculus Formulas", subject: "Mathematics", description: "Integration and differentiation formulas", cardCount: 0, masteredCount: 0, color: "bg-blue-500" }).returning().catch(() => [null]);

  if (deck1) {
    const cards = [
      { deckId: deck1.id, front: "What is the powerhouse of the cell?", back: "The mitochondria — produces ATP via cellular respiration", difficulty: "easy" },
      { deckId: deck1.id, front: "What is the function of the Golgi apparatus?", back: "Processes and packages proteins for transport out of the cell", difficulty: "medium" },
      { deckId: deck1.id, front: "What is the difference between mitosis and meiosis?", back: "Mitosis produces 2 identical daughter cells; meiosis produces 4 genetically distinct gametes", difficulty: "hard" },
      { deckId: deck1.id, front: "Define osmosis", back: "Movement of water molecules from high to low concentration through a semi-permeable membrane", difficulty: "easy" },
    ];
    for (const c of cards) {
      try { await db.insert(schema.flashcardsTable).values(c); } catch (_) {}
    }
    try { await db.update(schema.flashcardDecksTable).set({ cardCount: cards.length, masteredCount: 1 }).where(schema.flashcardDecksTable.id === deck1.id); } catch (_) {}
  }

  if (deck2) {
    const cards = [
      { deckId: deck2.id, front: "∫ x^n dx = ?", back: "x^(n+1) / (n+1) + C, where n ≠ -1", difficulty: "medium" },
      { deckId: deck2.id, front: "∫ e^x dx = ?", back: "e^x + C", difficulty: "easy" },
      { deckId: deck2.id, front: "∫ sin(x) dx = ?", back: "-cos(x) + C", difficulty: "medium" },
    ];
    for (const c of cards) {
      try { await db.insert(schema.flashcardsTable).values(c); } catch (_) {}
    }
  }

  // Quizzes
  const [quiz1] = await db.insert(schema.quizzesTable).values({ title: "Cell Biology Quiz", subject: "Biology", description: "Test your knowledge of cell biology fundamentals", questionCount: 4, attemptCount: 2, bestScore: 75, timeLimitMinutes: 15 }).returning().catch(() => [null]);
  if (quiz1) {
    const qs = [
      { quizId: quiz1.id, question: "Which organelle produces ATP?", options: ["Nucleus", "Mitochondria", "Golgi apparatus", "Vacuole"], correctIndex: 1, explanation: "The mitochondria is responsible for producing ATP through cellular respiration." },
      { quizId: quiz1.id, question: "What is the primary function of ribosomes?", options: ["DNA replication", "Energy production", "Protein synthesis", "Cell division"], correctIndex: 2, explanation: "Ribosomes synthesize proteins by translating mRNA sequences." },
      { quizId: quiz1.id, question: "Which type of cell division produces gametes?", options: ["Mitosis", "Meiosis", "Binary fission", "Budding"], correctIndex: 1, explanation: "Meiosis produces gametes (sex cells) with half the chromosome number." },
      { quizId: quiz1.id, question: "What is the cell membrane primarily made of?", options: ["Proteins only", "Carbohydrates", "Phospholipid bilayer", "DNA"], correctIndex: 2, explanation: "The cell membrane is a phospholipid bilayer with embedded proteins." },
    ];
    for (const q of qs) {
      try { await db.insert(schema.quizQuestionsTable).values(q); } catch (_) {}
    }
  }

  // Chats
  const [chat1] = await db.insert(schema.chatsTable).values({ title: "Understanding Photosynthesis", mode: "study", messageCount: 4, lastMessageAt: new Date() }).returning().catch(() => [null]);
  if (chat1) {
    const msgs = [
      { chatId: chat1.id, role: "user", content: "Can you explain how photosynthesis works?" },
      { chatId: chat1.id, role: "assistant", content: "Great question! Photosynthesis is the process by which plants convert light energy into chemical energy stored in glucose. It occurs in two main stages:\n\n1. **Light-dependent reactions** (in the thylakoids): Light is absorbed by chlorophyll, water is split to release oxygen, and ATP/NADPH are produced.\n\n2. **Calvin cycle** (in the stroma): ATP and NADPH are used to convert CO₂ into glucose.\n\nThe overall equation is: 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂\n\nWould you like me to go deeper into either stage?" },
      { chatId: chat1.id, role: "user", content: "What factors affect the rate of photosynthesis?" },
      { chatId: chat1.id, role: "assistant", content: "The main factors affecting photosynthesis rate are:\n\n**1. Light intensity** — More light = more photosynthesis (up to a saturation point)\n**2. CO₂ concentration** — Higher CO₂ increases rate (CO₂ is a reactant)\n**3. Temperature** — Enzymes work optimally at ~25-35°C; too high denatures them\n**4. Water availability** — Water is a reactant; shortage causes stomata to close\n**5. Chlorophyll amount** — More chlorophyll captures more light\n\nThese are known as **limiting factors** — at any given moment, the slowest factor limits the overall rate. This is a key concept for exam questions!" },
    ];
    for (const m of msgs) {
      try { await db.insert(schema.chatMessagesTable).values(m); } catch (_) {}
    }
  }

  // Revision topics
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const revisions = [
    { title: "Photosynthesis", subject: "Biology", notes: "Light-dependent and Calvin cycle", confidenceLevel: 3, reviewCount: 2, lastReviewedAt: new Date(Date.now() - 4 * 86400000), nextReviewAt: yesterday },
    { title: "Integration by parts", subject: "Mathematics", notes: "∫u dv = uv - ∫v du", confidenceLevel: 2, reviewCount: 1, lastReviewedAt: new Date(Date.now() - 2 * 86400000), nextReviewAt: new Date() },
    { title: "Organic reaction mechanisms", subject: "Chemistry", notes: "SN1, SN2, E1, E2 reactions", confidenceLevel: 4, reviewCount: 3, lastReviewedAt: new Date(Date.now() - 7 * 86400000), nextReviewAt: tomorrow },
    { title: "WWI causes", subject: "History", notes: "MAIN: Militarism, Alliances, Imperialism, Nationalism", confidenceLevel: 5, reviewCount: 4, nextReviewAt: new Date(Date.now() + 14 * 86400000) },
  ];
  for (const r of revisions) {
    try { await db.insert(schema.revisionTopicsTable).values(r); } catch (_) {}
  }

  // Notifications
  const notifications = [
    { title: "2 revisions due today", message: "Photosynthesis and Integration by parts need review", type: "warning", read: false },
    { title: "Quiz score: 75%", message: "You scored 75% on Cell Biology Quiz. Review the missed questions.", type: "quiz", read: false },
    { title: "Study goal updated", message: "Cell biology goal is now 65% complete — great progress!", type: "success", read: false },
    { title: "Welcome to BrainPilot AI", message: "Your intelligent study companion is ready. Start with the dashboard to see your overview.", type: "info", read: true },
    { title: "New flashcard deck created", message: "Cell Biology Fundamentals deck is ready to study", type: "success", read: true },
  ];
  for (const n of notifications) {
    try { await db.insert(schema.notificationsTable).values(n); } catch (_) {}
  }

  console.log("Seed complete!");
  await pool.end();
}

seed().catch(e => { console.error(e); process.exit(1); });
