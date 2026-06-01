import { Link } from "wouter";
import { useGetDashboardSummary, useGetActivityTimeline, useGetRecommendations, useListTasks } from "@workspace/api-client-react";
import { formatRelative, formatMinutes, cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from "recharts";
import {
  Flame, Clock, Target, Brain, TrendingUp, ArrowRight,
  CheckCircle2, Circle, Sparkles, RotateCcw, Zap, BookOpen
} from "lucide-react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function StatCard({ icon: Icon, label, value, sub, color }: { icon: React.ElementType; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", color)}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={cn("animate-pulse bg-muted rounded-lg", className)} />;
}

export default function DashboardPage() {
  const { data: summary, isLoading: loadingS } = useGetDashboardSummary();
  const { data: activity, isLoading: loadingA } = useGetActivityTimeline();
  const { data: recs, isLoading: loadingR } = useGetRecommendations();
  const { data: tasks } = useListTasks();

  const chartData = (summary?.weeklyMinutes ?? Array(7).fill(0)).map((m, i) => ({ day: DAYS[i], minutes: m }));
  const pending = (tasks ?? []).filter(t => t.status === "pending").slice(0, 4);

  const ACTIVITY_ICONS: Record<string, React.ElementType> = {
    quiz: Brain, flashcard: BookOpen, revision: RotateCcw, session: Clock, goal: Target,
  };
  const REC_PRIORITY_COLOR: Record<string, string> = {
    high: "text-rose-500", medium: "text-amber-500", low: "text-emerald-500",
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your study mission control</p>
        </div>
        <Link href="/chat">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer">
            <Sparkles className="w-4 h-4" />
            Ask AI
          </span>
        </Link>
      </div>

      {/* Stats grid */}
      {loadingS ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Clock} label="Study Time" value={formatMinutes(summary?.totalStudyMinutes ?? 0)} sub="All time" color="bg-blue-500" />
          <StatCard icon={Flame} label="Streak" value={`${summary?.studyStreak ?? 0} days`} sub="Keep it going" color="bg-orange-500" />
          <StatCard icon={Target} label="Goals" value={`${summary?.goalsCompleted ?? 0}/${summary?.goalsTotal ?? 0}`} sub="Completed" color="bg-emerald-500" />
          <StatCard icon={Brain} label="Avg Score" value={`${Math.round(summary?.averageScore ?? 0)}%`} sub={`${summary?.quizzesTaken ?? 0} quizzes`} color="bg-violet-500" />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Weekly chart */}
        <div className="lg:col-span-2 bg-card border border-card-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-foreground text-sm">Weekly Study Time</h2>
              <p className="text-xs text-muted-foreground">Minutes per day this week</p>
            </div>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={chartData} barCategoryGap="30%">
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [`${v}m`, "Study time"]}
              />
              <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Upcoming tasks */}
        <div className="bg-card border border-card-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground text-sm">Upcoming Tasks</h2>
            <Link href="/planner">
              <span className="text-xs text-primary hover:underline cursor-pointer">View all</span>
            </Link>
          </div>
          {pending.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No pending tasks</div>
          ) : (
            <div className="space-y-2">
              {pending.map((t) => (
                <div key={t.id} className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-muted/50 transition-colors" data-testid={`task-${t.id}`}>
                  <Circle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{t.title}</p>
                    <p className="text-xs text-muted-foreground">{t.subject} · {t.dueDate}</p>
                  </div>
                  <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded ml-auto shrink-0",
                    t.priority === "high" ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" :
                    t.priority === "medium" ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" :
                    "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                  )}>{t.priority}</span>
                </div>
              ))}
            </div>
          )}
          {summary && (summary.revisionsDue ?? 0) > 0 && (
            <Link href="/revisions">
              <span className="flex items-center justify-between mt-3 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-700/30 cursor-pointer hover:opacity-90 transition-opacity">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-300">{summary.revisionsDue} revisions due</span>
                </div>
                <ArrowRight className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              </span>
            </Link>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Activity timeline */}
        <div className="bg-card border border-card-border rounded-xl p-5">
          <h2 className="font-semibold text-foreground text-sm mb-4">Recent Activity</h2>
          {loadingA ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : (activity ?? []).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No recent activity</div>
          ) : (
            <div className="space-y-2">
              {(activity ?? []).slice(0, 5).map((item) => {
                const Icon = ACTIVITY_ICONS[item.type] ?? Zap;
                return (
                  <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/40 transition-colors" data-testid={`activity-${item.id}`}>
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{formatRelative(item.createdAt)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* AI Recommendations */}
        <div className="bg-card border border-card-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground text-sm">AI Recommendations</h2>
          </div>
          {loadingR ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : (recs ?? []).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No recommendations yet</div>
          ) : (
            <div className="space-y-3">
              {(recs ?? []).slice(0, 3).map((rec) => (
                <div key={rec.id} className="p-3.5 rounded-lg border border-border hover:border-primary/30 transition-colors cursor-default" data-testid={`rec-${rec.id}`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-medium text-foreground">{rec.title}</p>
                    <span className={cn("text-[10px] font-semibold shrink-0", REC_PRIORITY_COLOR[rec.priority])}>
                      {rec.priority}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{rec.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
