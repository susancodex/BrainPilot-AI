import { useDashboardSummary } from "@/hooks/use-dashboard";
import { useTrends, useSubjectBreakdown } from "@/hooks/use-analytics";
import { useStreak } from "@/hooks/use-productivity";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import {
  Flame, Clock, Target, FileText, Play, BookOpen,
  Layers, ArrowRight, TrendingUp, Calendar, Sparkles,
  MessageSquare, BarChart2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import type { DashboardSummary, StudyTrend, SubjectBreakdown } from "@/types";

const CHART_COLORS = [
  "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
  "hsl(var(--chart-4))", "hsl(var(--chart-5))",
];

const CHART_DOT_CLASSES = [
  "bg-blue-500",
  "bg-cyan-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
];

function getGreeting(name?: string) {
  const h = new Date().getHours();
  const greeting = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  return `${greeting}${name ? `, ${name.split(" ")[0]}` : ""}`;
}

interface StatCardProps {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accent: string;
  href?: string;
}

function StatCard({ title, value, sub, icon, accent, href }: StatCardProps) {
  const inner = (
    <Card className="border-border bg-card transition-colors hover:border-primary/40 cursor-pointer">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold text-foreground mt-1 tabular-nums sm:text-3xl">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`p-2.5 rounded-xl ${accent}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
  const { data: trends, isLoading: trendsLoading } = useTrends();
  const { data: subjects, isLoading: subjectsLoading } = useSubjectBreakdown();
  const { data: streak } = useStreak();

  const s = summary as DashboardSummary | undefined;

  if (summaryLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto min-w-0">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-72 rounded-xl lg:col-span-2" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  const todayMinutes = s?.today_focus_minutes ?? 0;
  const todayHours = (todayMinutes / 60).toFixed(1);

  return (
    <div className="space-y-6 max-w-7xl mx-auto min-w-0">
      <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2 flex-wrap sm:text-2xl md:text-3xl">
              {getGreeting(user?.first_name ?? user?.full_name)}
              {(streak?.current_streak ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1 text-orange-500 text-xl font-semibold">
                  <Flame className="w-5 h-5 fill-current" /> {streak?.current_streak}
                </span>
              )}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {s?.due_revisions
                ? `You have ${s.due_revisions} revision${s.due_revisions > 1 ? "s" : ""} due today.`
                : "You're all caught up — keep the streak going!"}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 shrink-0">
            <Button asChild variant="outline" className="gap-2 min-h-[44px] w-full sm:w-auto">
              <Link href="/chat"><MessageSquare className="w-4 h-4" />Ask AI</Link>
            </Button>
            <Button asChild className="gap-2 shadow-sm min-h-[44px] w-full sm:w-auto">
              <Link href="/productivity"><Play className="w-4 h-4 fill-current" />Focus Now</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        <StatCard
          title="Streak"
          value={`${s?.streak ?? 0}d`}
          sub={streak?.longest_streak ? `Best: ${streak.longest_streak}d` : "Keep going!"}
          icon={<Flame className="w-4 h-4 text-orange-500" />}
          accent="bg-orange-500/10"
          href="/productivity"
        />
        <StatCard
          title="Today's Focus"
          value={`${todayHours}h`}
          sub={`${s?.today_sessions ?? 0} session${(s?.today_sessions ?? 0) !== 1 ? "s" : ""}`}
          icon={<Clock className="w-4 h-4 text-blue-500" />}
          accent="bg-blue-500/10"
          href="/productivity"
        />
        <StatCard
          title="Active Goals"
          value={s?.goals_summary?.active ?? 0}
          sub={`${s?.goals_summary?.completed ?? 0} completed`}
          icon={<Target className="w-4 h-4 text-green-500" />}
          accent="bg-green-500/10"
          href="/goals"
        />
        <StatCard
          title="Notes"
          value={s?.notes_count ?? 0}
          sub={`${s?.due_revisions ?? 0} revisions due`}
          icon={<FileText className="w-4 h-4 text-slate-600" />}
          accent="bg-slate-600/10"
          href="/notes"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border">
          <CardHeader className="flex flex-col gap-2 pb-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary shrink-0" /> Weekly Study Hours
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground h-9 min-h-[44px] w-fit self-start sm:h-7 sm:min-h-0">
              <Link href="/analytics">View all <ArrowRight className="w-3 h-3 ml-1" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="h-48 min-h-[12rem] sm:h-56">
            {trendsLoading ? (
              <Skeleton className="h-full w-full rounded" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(trends as StudyTrend[] | undefined) ?? []} barSize={28}>
                  <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${v}h`} />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--muted))", radius: 4 }}
                    contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }}
                    formatter={(v: number) => [`${v}h`, "Study time"]}
                  />
                  <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-chart-3" /> Subject Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="h-48 min-h-[12rem] sm:h-56 flex flex-col items-center justify-center">
            {subjectsLoading ? (
              <Skeleton className="h-full w-full rounded" />
            ) : (subjects as SubjectBreakdown[] | undefined)?.length ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={subjects as SubjectBreakdown[]} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={3} dataKey="value">
                      {(subjects as SubjectBreakdown[]).map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
                  {(subjects as SubjectBreakdown[]).slice(0, 4).map((sub, i) => (
                    <div key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
                      <div className={cn("w-2 h-2 rounded-full shrink-0", CHART_DOT_CLASSES[i % CHART_DOT_CLASSES.length])} />
                      {sub.name}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground text-sm">
                <BookOpen className="w-10 h-10 mx-auto mb-2 text-muted" />
                Start studying to see your breakdown
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {s?.recent_activity?.length ? (
              <div className="space-y-2.5">
                {s.recent_activity.slice(0, 6).map((activity, i) => (
                  <div key={i} className="flex items-start gap-3 min-w-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
                    <span className="text-sm text-foreground flex-1 min-w-0 break-words">{activity.description}</span>
                    <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">{activity.time}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Calendar className="w-10 h-10 mb-3 text-muted" />
                <p className="text-sm">No activity yet — start a session!</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-primary">
                <Sparkles className="w-4 h-4" /> AI Suggestion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground leading-relaxed">
                {s?.ai_suggestion ?? "Great consistency! Keep reviewing your topics and stay ahead of your goals."}
              </p>
              <Button variant="outline" size="sm" asChild className="mt-3 w-full border-primary/30">
                <Link href="/chat"><MessageSquare className="w-3.5 h-3.5 mr-2" />Discuss with AI</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 sm:gap-3">
              {[
                { label: "New Note", icon: FileText, href: "/notes", color: "text-slate-700" },
                { label: "Flashcards", icon: Layers, href: "/flashcards", color: "text-amber-600" },
                { label: "Revision", icon: BookOpen, href: "/revision", color: "text-blue-600" },
                { label: "Analytics", icon: BarChart2, href: "/analytics", color: "text-emerald-600" },
              ].map(({ label, icon: Icon, href, color }) => (
                <Button key={label} variant="outline" size="sm" asChild className="h-auto min-h-[44px] py-3 flex-col gap-1.5 border-border hover:border-primary/40">
                  <Link href={href}>
                    <Icon className={`w-4 h-4 ${color}`} />
                    <span className="text-xs font-medium">{label}</span>
                  </Link>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
