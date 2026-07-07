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
  "bg-blue-500", "bg-cyan-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500",
];

function getGreeting(name?: string) {
  const h = new Date().getHours();
  const base = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  return name ? `${base}, ${name.split(" ")[0]}` : base;
}

// ── Stat card ───────────────────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  iconBg: string;
  href?: string;
}

function StatCard({ title, value, sub, icon, iconBg, href }: StatCardProps) {
  const content = (
    <Card className={cn(
      "border-border bg-card",
      href && "cursor-pointer",
    )}>
      <CardContent className="flex items-start justify-between gap-4 p-6">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">
            {title}
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-foreground">
            {value}
          </p>
          {sub && (
            <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
          )}
        </div>
        <div className={cn("shrink-0 rounded-lg p-3", iconBg)}>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

// ── Section header ───────────────────────────────────────────────────────────
function SectionHeader({
  icon: Icon,
  title,
  href,
  linkLabel = "View all",
}: {
  icon: React.ElementType;
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
        <Icon className="h-5 w-5 text-muted-foreground" />
        {title}
      </h2>
      {href && (
        <Button variant="ghost" size="sm" asChild>
          <Link href={href}>
            {linkLabel}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      )}
    </div>
  );
}

// ── Loading skeleton ─────────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Skeleton className="h-[100px] w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-[104px] rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-xl lg:col-span-2" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

// ── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user }                                     = useAuth();
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
  const { data: trends,  isLoading: trendsLoading }  = useTrends();
  const { data: subjects, isLoading: subjectsLoading } = useSubjectBreakdown();
  const { data: streak }                             = useStreak();

  const s = summary as DashboardSummary | undefined;

  if (summaryLoading) return <DashboardSkeleton />;

  const todayHours = ((s?.today_focus_minutes ?? 0) / 60).toFixed(1);

  return (
    <div className="mx-auto max-w-7xl space-y-6">

      {/* ── Header banner ─────────────────────────────────────────────────── */}
      <div className="rounded-lg border border-border bg-card px-6 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="flex flex-wrap items-center gap-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {getGreeting(user?.first_name ?? user?.full_name)}
              {(streak?.current_streak ?? 0) > 0 && (
                <span className="inline-flex items-center gap-2 text-xl font-semibold">
                  <Flame className="h-5 w-5 fill-current" />
                  {streak?.current_streak}
                </span>
              )}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {s?.due_revisions
                ? `You have ${s.due_revisions} revision${s.due_revisions > 1 ? "s" : ""} due today.`
                : "You're all caught up — keep the streak going!"}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" asChild>
              <Link href="/chat">
                <MessageSquare className="mr-2 h-4 w-4" />
                Ask AI
              </Link>
            </Button>
            <Button asChild>
              <Link href="/productivity">
                <Play className="mr-2 h-4 w-4 fill-current" />
                Focus now
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* ── KPI row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Streak"
          value={`${s?.streak ?? 0}d`}
          sub={streak?.longest_streak ? `Best: ${streak.longest_streak}d` : "Keep going!"}
          icon={<Flame className="h-4 w-4 text-orange-600" />}
          iconBg="bg-orange-100 dark:bg-orange-950"
          href="/productivity"
        />
        <StatCard
          title="Today's focus"
          value={`${todayHours}h`}
          sub={`${s?.today_sessions ?? 0} session${(s?.today_sessions ?? 0) !== 1 ? "s" : ""}`}
          icon={<Clock className="h-4 w-4 text-blue-600" />}
          iconBg="bg-blue-100 dark:bg-blue-950"
          href="/productivity"
        />
        <StatCard
          title="Active goals"
          value={s?.goals_summary?.active ?? 0}
          sub={`${s?.goals_summary?.completed ?? 0} completed`}
          icon={<Target className="h-4 w-4 text-emerald-600" />}
          iconBg="bg-emerald-100 dark:bg-emerald-950"
          href="/goals"
        />
        <StatCard
          title="Notes"
          value={s?.notes_count ?? 0}
          sub={`${s?.due_revisions ?? 0} revisions due`}
          icon={<FileText className="h-4 w-4 text-slate-600" />}
          iconBg="bg-slate-100 dark:bg-slate-800"
          href="/notes"
        />
      </div>

      {/* ── Charts row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Weekly bar chart */}
        <Card className="border-border lg:col-span-2">
          <CardHeader className="px-6 pb-4 pt-6">
            <SectionHeader icon={BarChart2} title="Weekly Study Hours" href="/analytics" />
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="h-72">
              {trendsLoading ? (
                <Skeleton className="h-full w-full rounded" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(trends as StudyTrend[] | undefined) ?? []} barSize={32} barGap={8}>
                    <XAxis
                      dataKey="name"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      stroke="hsl(var(--muted-foreground))"
                      tickFormatter={(v) => `${v}h`}
                      width={32}
                    />
                    <Tooltip
                      cursor={{ fill: "hsl(var(--muted))", radius: 4 }}
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid hsl(var(--border))",
                        background: "hsl(var(--card))",
                        fontSize: 13,
                      }}
                      formatter={(v: number) => [`${v}h`, "Study time"]}
                    />
                    <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Subject donut */}
        <Card className="border-border">
          <CardHeader className="px-6 pb-4 pt-6">
            <SectionHeader icon={BookOpen} title="Subject Breakdown" />
          </CardHeader>
          <CardContent className="flex flex-col items-center px-6 pb-6">
            <div className="h-72 w-full">
              {subjectsLoading ? (
                <Skeleton className="h-full w-full rounded" />
              ) : (subjects as SubjectBreakdown[] | undefined)?.length ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={subjects as SubjectBreakdown[]}
                        cx="50%" cy="50%"
                        innerRadius={56} outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {(subjects as SubjectBreakdown[]).map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: 8,
                          border: "1px solid hsl(var(--border))",
                          background: "hsl(var(--card))",
                          fontSize: 13,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2">
                    {(subjects as SubjectBreakdown[]).slice(0, 4).map((sub, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className={cn("h-2.5 w-2.5 shrink-0 rounded-full", CHART_DOT_CLASSES[i % CHART_DOT_CLASSES.length])} />
                        {sub.name}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                  <BookOpen className="mb-3 h-10 w-10 text-border" />
                  <p className="text-sm">Start studying to see your breakdown</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Bottom row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Recent activity */}
        <Card className="border-border lg:col-span-2">
          <CardHeader className="px-6 pb-4 pt-6">
            <SectionHeader icon={TrendingUp} title="Recent Activity" />
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {s?.recent_activity?.length ? (
              <ul className="space-y-4">
                {s.recent_activity.slice(0, 6).map((activity, i) => (
                  <li key={i} className="flex min-w-0 items-start gap-4">
                    <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary/80" />
                    <span className="min-w-0 flex-1 break-words text-sm text-foreground">
                      {activity.description}
                    </span>
                    <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
                      {activity.time}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <Calendar className="mb-4 h-10 w-10 text-border" />
                <p className="text-sm">No activity yet — start a session to see it here.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column: AI suggestion + quick actions */}
        <div className="space-y-6">

          {/* AI suggestion */}
          <Card className="border-primary/20 bg-primary/[0.02]">
            <CardHeader className="px-6 pb-3 pt-6">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Sparkles className="h-4 w-4" />
                AI Suggestion
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <p className="text-sm leading-relaxed text-foreground">
                {s?.ai_suggestion ?? "Great consistency! Keep reviewing your topics and stay ahead of your goals."}
              </p>
              <Button variant="outline" size="sm" asChild className="mt-4 w-full border-primary/20">
                <Link href="/chat">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Discuss with AI
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card className="border-border">
            <CardHeader className="px-6 pb-3 pt-6">
              <CardTitle className="text-sm font-semibold text-foreground">Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 px-6 pb-6">
              {[
                { label: "New Note",   icon: FileText, href: "/notes",     color: "text-slate-600" },
                { label: "Flashcards", icon: Layers,   href: "/flashcards", color: "text-amber-600" },
                { label: "Revision",   icon: BookOpen, href: "/revision",   color: "text-blue-600"  },
                { label: "Analytics",  icon: BarChart2,href: "/analytics",  color: "text-emerald-600" },
              ].map(({ label, icon: Icon, href, color }) => (
                <Button
                  key={label}
                  variant="outline"
                  size="sm"
                  asChild
                  className="flex h-auto min-h-[72px] flex-col gap-2 border-border py-4"
                >
                  <Link href={href}>
                    <Icon className={cn("h-5 w-5", color)} />
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
