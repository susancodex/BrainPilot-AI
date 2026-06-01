import { Router } from "express";
import { db } from "../lib/db";
import { studySessionsTable, goalsTable, quizzesTable, plannerTasksTable, revisionTopicsTable } from "@workspace/db";
import { sql, eq, gte, and, lte } from "drizzle-orm";

const router = Router();

router.get("/dashboard/summary", async (_req, res) => {
  try {
    const [sessionsTotal] = await db.select({ total: sql<number>`COALESCE(SUM(${studySessionsTable.durationMinutes}), 0)` }).from(studySessionsTable);
    const [goalsData] = await db.select({ total: sql<number>`COUNT(*)`, completed: sql<number>`SUM(CASE WHEN ${goalsTable.status} = 'completed' THEN 1 ELSE 0 END)` }).from(goalsTable);
    const [quizData] = await db.select({ count: sql<number>`COUNT(*)`, avg: sql<number>`COALESCE(AVG(${quizzesTable.bestScore}), 0)` }).from(quizzesTable);
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const sessions = await db.select().from(studySessionsTable).where(gte(studySessionsTable.createdAt, startOfWeek));
    const weeklyMinutes: number[] = Array(7).fill(0);
    sessions.forEach(s => {
      const day = new Date(s.createdAt).getDay();
      weeklyMinutes[day] = (weeklyMinutes[day] || 0) + s.durationMinutes;
    });
    const due = await db.select().from(revisionTopicsTable).where(lte(revisionTopicsTable.nextReviewAt, new Date()));

    // Compute streak
    const allDays = await db.select({ date: studySessionsTable.createdAt }).from(studySessionsTable).orderBy(sql`${studySessionsTable.createdAt} DESC`);
    let streak = 0;
    const seen = new Set<string>();
    allDays.forEach(d => seen.add(new Date(d.date).toDateString()));
    let check = new Date();
    while (seen.has(check.toDateString())) { streak++; check.setDate(check.getDate() - 1); }

    res.json({
      totalStudyMinutes: Number(sessionsTotal?.total ?? 0),
      studyStreak: streak,
      goalsTotal: Number(goalsData?.total ?? 0),
      goalsCompleted: Number(goalsData?.completed ?? 0),
      averageScore: Number(quizData?.avg ?? 0),
      quizzesTaken: Number(quizData?.count ?? 0),
      revisionsDue: due.length,
      weeklyMinutes,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/activity", async (_req, res) => {
  try {
    const sessions = await db.select().from(studySessionsTable).orderBy(sql`${studySessionsTable.createdAt} DESC`).limit(10);
    const activity = sessions.map(s => ({
      id: `session-${s.id}`,
      type: "session",
      title: s.subject,
      description: `Studied for ${s.durationMinutes} minutes`,
      createdAt: s.createdAt,
    }));
    res.json(activity);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/recommendations", async (_req, res) => {
  try {
    const due = await db.select().from(revisionTopicsTable).where(lte(revisionTopicsTable.nextReviewAt, new Date())).limit(3);
    const tasks = await db.select().from(plannerTasksTable).where(eq(plannerTasksTable.status, "pending")).limit(3);
    const recommendations = [
      ...due.map((r, i) => ({ id: i + 1, title: `Review: ${r.title}`, reason: "This topic is overdue for revision based on spaced repetition", priority: "high", type: "revision" })),
      ...tasks.map((t, i) => ({ id: due.length + i + 1, title: t.title, reason: `Due on ${t.dueDate} — prioritise to stay on track`, priority: t.priority, type: "task" })),
    ].slice(0, 5);
    if (recommendations.length === 0) {
      recommendations.push({ id: 1, title: "Start a new study session", reason: "You haven't studied today yet. Consistency builds mastery.", priority: "medium", type: "suggestion" });
    }
    res.json(recommendations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
