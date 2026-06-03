import { useTrends, useSubjectBreakdown, useQuizPerformance, useRevisionStats } from "@/hooks/use-analytics";
import { useStreak, useFocusLogs } from "@/hooks/use-productivity";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  StudyTrend, SubjectBreakdown, StudyStreak, FocusLog,
  QuizPerformanceResponse, RevisionStatsResponse,
} from "@/types";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import { TrendingUp, BookOpen, BrainCircuit, BarChart2, Target, Star } from "lucide-react";

const COLORS = [
  "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
  "hsl(var(--chart-4))", "hsl(var(--chart-5))",
];

const tooltipStyle = {
  contentStyle: {
    borderRadius: 8,
    border: "1px solid hsl(var(--border))",
    background: "hsl(var(--card))",
    fontSize: 12,
  },
};

export default function Analytics() {
  const { data: trends, isLoading: trendsLoading } = useTrends();
  const { data: subjects, isLoading: subjectsLoading } = useSubjectBreakdown();
  const { data: quizPerf, isLoading: quizLoading } = useQuizPerformance();
  const { data: revStats, isLoading: revLoading } = useRevisionStats();
  const { data: streak } = useStreak();
  const { data: focusLogs, isLoading: focusLoading } = useFocusLogs();

  const s = streak as StudyStreak | undefined;
  const trendData = (trends as StudyTrend[] | undefined) ?? [];
  const subjectData = (subjects as SubjectBreakdown[] | undefined) ?? [];
  const logs = (focusLogs as FocusLog[] | undefined) ?? [];
  const quiz = quizPerf as QuizPerformanceResponse | undefined;
  const rev = revStats as RevisionStatsResponse | undefined;

  const totalHoursThisWeek = trendData.reduce((sum, d) => sum + (d.hours ?? 0), 0);
  const avgHoursPerDay = trendData.length ? (totalHoursThisWeek / trendData.length).toFixed(1) : "0";

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">Deep insights into your study habits and performance.</p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "This Week",
            value: `${totalHoursThisWeek.toFixed(1)}h`,
            sub: `${avgHoursPerDay}h avg/day`,
            icon: <TrendingUp className="w-4 h-4 text-blue-500" />,
            accent: "bg-blue-500/10",
          },
          {
            label: "Current Streak",
            value: `${s?.current_streak ?? 0}d`,
            sub: `Best: ${s?.longest_streak ?? 0}d`,
            icon: <Star className="w-4 h-4 text-orange-500" />,
            accent: "bg-orange-500/10",
          },
          {
            label: "Quiz Avg",
            value: quizLoading ? "—" : `${Math.round(quiz?.summary?.avg_percentage ?? 0)}%`,
            sub: quizLoading ? "" : `${quiz?.summary?.total_attempts ?? 0} quizzes taken`,
            icon: <BrainCircuit className="w-4 h-4 text-purple-500" />,
            accent: "bg-purple-500/10",
          },
          {
            label: "Due Revisions",
            value: revLoading ? "—" : (rev?.due_count ?? 0),
            sub: revLoading ? "" : `${rev?.weak_topics ?? 0} weak topics`,
            icon: <BookOpen className="w-4 h-4 text-green-500" />,
            accent: "bg-green-500/10",
          },
        ].map(({ label, value, sub, icon, accent }) => (
          <Card key={label} className="border-border">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${accent}`}>{icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weekly hours + Focus log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary" /> Weekly Study Hours
            </CardTitle>
            <CardDescription>Hours studied per day this week</CardDescription>
          </CardHeader>
          <CardContent className="h-56">
            {trendsLoading ? <Skeleton className="h-full w-full rounded" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" tickFormatter={(v: number) => `${v}h`} />
                  <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v}h`, "Hours"]} />
                  <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-chart-2" /> Daily Focus Trend
            </CardTitle>
            <CardDescription>Minutes of focus over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent className="h-56">
            {focusLoading ? <Skeleton className="h-full w-full rounded" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={logs.slice(-30).map((l) => ({ date: l.date.slice(5), minutes: l.total_minutes }))}>
                  <defs>
                    <linearGradient id="focusGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" interval={4} />
                  <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" tickFormatter={(v: number) => `${v}m`} />
                  <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v} min`, "Focus"]} />
                  <Area type="monotone" dataKey="minutes" stroke="hsl(var(--chart-2))" fill="url(#focusGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Subject breakdown + Quiz performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-chart-3" /> Subject Distribution
            </CardTitle>
            <CardDescription>Breakdown of study time by subject</CardDescription>
          </CardHeader>
          <CardContent>
            {subjectsLoading ? <Skeleton className="h-48 w-full rounded" /> : subjectData.length ? (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={subjectData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                      {subjectData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 w-full mt-2">
                  {subjectData.slice(0, 6).map((sub, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="truncate">{sub.name}</span>
                      <span className="ml-auto font-medium text-foreground">{sub.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                Start studying subjects to see breakdown
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-chart-4" /> Quiz Performance
            </CardTitle>
            <CardDescription>Score trends across all quiz attempts</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            {quizLoading ? <Skeleton className="h-full w-full rounded" /> : (
              <>
                {quiz?.by_subject?.length ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={quiz.by_subject} barSize={28}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="subject" fontSize={10} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                      <YAxis domain={[0, 100]} fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}%`} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v}%`, "Accuracy"]} />
                      <Bar dataKey="accuracy" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
                    Take some quizzes to see performance trends
                  </div>
                )}
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {[
                    { label: "Avg Score", value: `${Math.round(quiz?.summary?.avg_percentage ?? 0)}%` },
                    { label: "Total Attempts", value: quiz?.summary?.total_attempts ?? 0 },
                    { label: "Subjects Covered", value: quiz?.by_subject?.length ?? 0 },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center p-2 bg-muted/40 rounded-lg">
                      <div className="font-bold text-sm text-foreground">{value}</div>
                      <div className="text-[10px] text-muted-foreground">{label}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revision stats */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4 text-chart-5" /> Spaced Repetition Health
          </CardTitle>
          <CardDescription>Status of your revision topics</CardDescription>
        </CardHeader>
        <CardContent>
          {revLoading ? <Skeleton className="h-20 w-full rounded" /> : (
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Due Today", value: rev?.due_count ?? 0, color: "text-orange-500" },
                { label: "Weak Topics", value: rev?.weak_topics ?? 0, color: "text-red-500" },
                { label: "Mastered", value: rev?.mastered ?? 0, color: "text-green-500" },
              ].map(({ label, value, color }) => (
                <div key={label} className="p-4 rounded-xl bg-muted/40 text-center">
                  <div className={`text-3xl font-bold ${color}`}>{value}</div>
                  <div className="text-xs text-muted-foreground mt-1 font-medium">{label}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
