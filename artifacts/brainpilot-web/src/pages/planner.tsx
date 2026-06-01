import { usePlans, useGeneratePlan, useSessions } from "@/hooks/use-planner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Plus, Calendar, Clock, BookOpen } from "lucide-react";

export default function Planner() {
  const { data: plans, isLoading: plansLoading } = usePlans();
  const { data: sessions, isLoading: sessionsLoading } = useSessions();
  const generatePlan = useGeneratePlan();
  const [topic, setTopic] = useState("");

  const handleGenerate = () => {
    if (!topic) return;
    generatePlan.mutate({ topic, duration_days: 7, daily_hours: 2 });
    setTopic("");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Study Planner</h1>
          <p className="text-muted-foreground mt-1">Organize your study schedule and track progress.</p>
        </div>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Generate New Plan</CardTitle>
          <CardDescription>Let AI create an optimized study schedule for you.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input 
              placeholder="E.g. Cell Biology, World War II..." 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="max-w-md"
            />
            <Button onClick={handleGenerate} disabled={generatePlan.isPending || !topic}>
              {generatePlan.isPending ? "Generating..." : "Create Plan"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Your Plans</h2>
          {plansLoading ? (
            <div className="text-muted-foreground">Loading plans...</div>
          ) : plans?.length ? (
            plans.map((plan: any) => (
              <Card key={plan.id} className="border-border">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    {plan.topic}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4"/> {plan.duration_days} Days</span>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4"/> {plan.daily_hours} hrs/day</span>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center p-8 border border-dashed rounded-xl text-muted-foreground">
              No plans yet. Generate one above!
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Upcoming Sessions</h2>
          {sessionsLoading ? (
            <div className="text-muted-foreground">Loading sessions...</div>
          ) : sessions?.length ? (
            sessions.map((session: any) => (
              <Card key={session.id} className="border-border">
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <div className="font-medium">{session.title || "Study Session"}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(session.date).toLocaleDateString()}
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Start</Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center p-8 border border-dashed rounded-xl text-muted-foreground">
              No upcoming sessions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
