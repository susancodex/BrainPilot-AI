import { usePlans, useGeneratePlan, useSessions, useUpdateSession } from "@/hooks/use-planner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Calendar, Clock, BookOpen, Layers, Sparkles } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import type { StudyPlan, StudySession } from "@/types";

export default function Planner() {
  const { data: plans, isLoading: plansLoading } = usePlans();
  const { data: sessions, isLoading: sessionsLoading } = useSessions();
  const generatePlan = useGeneratePlan();
  const updateSession = useUpdateSession();

  const [formData, setFormData] = useState({
    subjects: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    plan_type: "weekly",
    daily_hours: [2],
  });

  const handleGenerate = () => {
    if (!formData.subjects) return;
    generatePlan.mutate({
      subjects: formData.subjects.split(",").map((s) => s.trim()).filter(Boolean),
      start_date: formData.start_date,
      end_date: formData.end_date,
      plan_type: formData.plan_type,
      daily_hours: formData.daily_hours[0],
    });
  };

  const handleStatusChange = (id: string, status: string) => {
    updateSession.mutate({ id, status });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500/10 text-green-500";
      case "in_progress": return "bg-amber-500/10 text-amber-500";
      case "skipped": return "bg-destructive/10 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const planList = (plans as StudyPlan[] | undefined) ?? [];
  const sessionList = (sessions as StudySession[] | undefined) ?? [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">AI Study Planner</h1>
          <p className="text-muted-foreground mt-1">Let AI create your optimal learning schedule.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-border shadow-md border-primary/20 bg-card overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-primary to-accent" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Generate Plan
              </CardTitle>
              <CardDescription>Tell the AI what you need to study.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Subjects (comma separated)</Label>
                <Input
                  placeholder="e.g. Biology, Chemistry"
                  value={formData.subjects}
                  onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Plan Type</Label>
                <Select value={formData.plan_type} onValueChange={(v) => setFormData({ ...formData, plan_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily Intensive</SelectItem>
                    <SelectItem value="weekly">Weekly Routine</SelectItem>
                    <SelectItem value="monthly">Monthly Marathon</SelectItem>
                    <SelectItem value="emergency">Emergency Cram</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>Daily Hours</Label>
                  <span className="font-bold text-primary">{formData.daily_hours[0]}h</span>
                </div>
                <Slider min={0.5} max={16} step={0.5} value={formData.daily_hours} onValueChange={(v) => setFormData({ ...formData, daily_hours: v })} />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full gap-2" onClick={handleGenerate} disabled={generatePlan.isPending || !formData.subjects}>
                {generatePlan.isPending ? "AI is thinking..." : "Generate AI Plan"}
              </Button>
            </CardFooter>
          </Card>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Your Plans</h2>
            {plansLoading ? (
              <div className="text-muted-foreground">Loading...</div>
            ) : planList.length ? (
              planList.map((plan) => (
                <Card key={plan.id} className="border-border shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Layers className="w-5 h-5 text-primary" />
                      {plan.title || "Study Plan"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="flex gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {plan.duration_days || "—"} Days</span>
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {plan.daily_hours}h/day</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="bg-muted px-2 py-1 rounded">
                        Type: <span className="font-semibold text-foreground uppercase">{plan.plan_type}</span>
                      </span>
                      <span className="text-primary font-medium">
                        {plan.completed_sessions || 0}/{plan.session_count || 0} Sessions
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-muted-foreground p-4 bg-muted/50 rounded-lg text-center text-sm">
                No plans generated yet.
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-xl font-semibold">Study Sessions</h2>
          {sessionsLoading ? (
            <div className="text-muted-foreground">Loading sessions...</div>
          ) : sessionList.length ? (
            <div className="space-y-3">
              {sessionList.map((session) => (
                <Card key={session.id} className="border-border shadow-sm overflow-hidden flex flex-row">
                  <div className="w-2 bg-primary" />
                  <div className="p-4 flex-1 flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${getStatusColor(session.status)}`}>
                          {session.status.replace("_", " ")}
                        </span>
                        <span className="text-xs font-medium text-muted-foreground">{session.subject}</span>
                      </div>
                      <div className="font-semibold text-foreground">{session.topic}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(session.scheduled_date).toLocaleDateString()}
                        <span className="mx-1">•</span>
                        <Clock className="w-3.5 h-3.5" />
                        {session.start_time} - {session.end_time}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <Select value={session.status} onValueChange={(v) => handleStatusChange(session.id, v)}>
                        <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="skipped">Skipped</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center p-12 border border-dashed rounded-xl text-muted-foreground bg-card">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-muted" />
              <p className="text-lg font-medium text-foreground">Empty Calendar</p>
              <p>Generate a plan to populate your study sessions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
