import { Router } from "express";
import { db } from "../lib/db";
import { quizzesTable, quizQuestionsTable, insertQuizSchema, insertQuizQuestionSchema } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

router.get("/quizzes", async (_req, res) => {
  try {
    const rows = await db.select().from(quizzesTable).orderBy(sql`${quizzesTable.createdAt} DESC`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/quizzes", async (req, res) => {
  try {
    const { questions, ...quizData } = req.body;
    const parsed = insertQuizSchema.safeParse({ ...quizData, questionCount: questions?.length ?? 0 });
    if (!parsed.success) return res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    const [quiz] = await db.insert(quizzesTable).values(parsed.data).returning();
    if (Array.isArray(questions) && questions.length > 0) {
      const questionRows = questions.map((q: { question: string; options: string[]; correctIndex: number; explanation?: string }) => ({
        quizId: quiz.id,
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation ?? null,
      }));
      await db.insert(quizQuestionsTable).values(questionRows);
    }
    const qs = await db.select().from(quizQuestionsTable).where(eq(quizQuestionsTable.quizId, quiz.id));
    res.status(201).json({ ...quiz, questions: qs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/quizzes/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [quiz] = await db.select().from(quizzesTable).where(eq(quizzesTable.id, id));
    if (!quiz) return res.status(404).json({ error: "Not found" });
    const questions = await db.select().from(quizQuestionsTable).where(eq(quizQuestionsTable.quizId, id));
    res.json({ ...quiz, questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/quizzes/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(quizzesTable).where(eq(quizzesTable.id, id));
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/quizzes/:id/submit", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { answers } = req.body as { answers: number[]; timeTakenSeconds?: number };
    const questions = await db.select().from(quizQuestionsTable).where(eq(quizQuestionsTable.quizId, id));
    if (!questions.length) return res.status(404).json({ error: "No questions found" });
    let correct = 0;
    const feedback = questions.map((q, i) => {
      const selected = answers[i] ?? -1;
      const isCorrect = selected === q.correctIndex;
      if (isCorrect) correct++;
      return { questionId: q.id, correct: isCorrect, selectedIndex: selected, correctIndex: q.correctIndex, explanation: q.explanation };
    });
    const score = (correct / questions.length) * 100;
    const [quiz] = await db.select().from(quizzesTable).where(eq(quizzesTable.id, id));
    const newBest = quiz?.bestScore == null ? score : Math.max(quiz.bestScore, score);
    await db.update(quizzesTable).set({ bestScore: newBest, attemptCount: sql`${quizzesTable.attemptCount} + 1` }).where(eq(quizzesTable.id, id));
    res.json({ score, correctCount: correct, totalCount: questions.length, passed: score >= 60, feedback });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
