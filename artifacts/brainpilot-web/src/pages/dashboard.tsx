import { useDashboardSummary } from "@/hooks/use-dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Clock, Target, FileText, Play } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: summary, isLoading } = useDashboardSummary();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <Button asChild size="lg" className="gap-2">
          <Link href="/productivity">
            <Play className="w-4 h-4" fill="currentColor" />
            Start Pomodoro
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Study Streak</CardTitle>
            <Flame className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.streak || 0} Days</div>
            <p className="text-xs text-muted-foreground mt-1">Keep it up!</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Sessions</CardTitle>
            <Clock className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.today_sessions || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Completed today</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Goals</CardTitle>
            <Target className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.goals_summary?.active || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary?.goals_summary?.completed || 0} completed
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Notes</CardTitle>
            <FileText className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.notes_count || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Total notes saved</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border flex flex-col">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            {summary?.recent_activity?.length > 0 ? (
              <ul className="space-y-4">
                {summary.recent_activity.map((activity: any, i: number) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-foreground">{activity.description}</span>
                    <span className="text-muted-foreground ml-auto">{activity.time}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
                <p>No recent activity.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border flex flex-col bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle>AI Tutor Suggestion</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            <p className="text-lg font-medium leading-relaxed mb-6">
              "You've been studying Biology consistently, but haven't reviewed Chemistry in 3 days. A short 25-minute Pomodoro session on Chemistry might be good right now."
            </p>
            <Button variant="default" asChild className="w-fit">
              <Link href="/chat">Discuss with AI</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
