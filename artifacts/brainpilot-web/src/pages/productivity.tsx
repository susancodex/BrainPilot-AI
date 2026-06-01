import { useState, useEffect } from "react";
import { useCompleteSession, useStartPomodoro, useCompletePomodoro, useStreak, usePomodoro } from "@/hooks/use-productivity";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Play, Pause, Square, Flame, Timer, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Productivity() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  
  const startPomodoro = useStartPomodoro();
  const completeSession = useCompleteSession();
  
  const { data: streakData } = useStreak();
  const { data: pomodoros } = usePomodoro();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      completeSession.mutate({ focus_minutes: 25, subject, task_description: description });
      // In a real app we might play a sound here
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft, completeSession, subject, description]);

  const handleStart = () => {
    if (!subject) return;
    if (!isRunning && timeLeft === 25 * 60) {
      startPomodoro.mutate({ subject, task_description: description, work_duration_minutes: 25 });
    }
    setIsRunning(true);
  };
  
  const handlePause = () => setIsRunning(false);
  
  const handleStop = () => {
    setIsRunning(false);
    setTimeLeft(25 * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = ((25 * 60 - timeLeft) / (25 * 60)) * 100;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Focus Mode</h1>
          <p className="text-muted-foreground mt-1">Deep work sessions and productivity tracking.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-full font-bold shadow-sm">
          <Flame className="w-5 h-5" fill="currentColor" />
          {streakData?.current_streak || 0} Day Streak
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <Card className="border-border shadow-lg bg-card">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-bold">Pomodoro Timer</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-8">
              <div className="relative w-72 h-72 flex items-center justify-center mb-10">
                <svg className="w-full h-full transform -rotate-90 drop-shadow-md">
                  <circle cx="144" cy="144" r="136" className="stroke-muted fill-none" strokeWidth="8" />
                  <circle
                    cx="144" cy="144" r="136"
                    className="stroke-primary fill-none transition-all duration-1000 ease-linear"
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 136}
                    strokeDashoffset={2 * Math.PI * 136 * (1 - progress / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className={cn("text-7xl font-bold tabular-nums tracking-tighter", isRunning ? "text-primary" : "text-foreground")}>
                    {formatTime(timeLeft)}
                  </span>
                  <span className="text-sm text-muted-foreground mt-2 uppercase tracking-widest font-semibold flex items-center gap-1">
                    <Timer className="w-4 h-4" /> Focus
                  </span>
                </div>
              </div>

              <div className="w-full max-w-sm space-y-4">
                <div className="space-y-3">
                  <Input 
                    placeholder="Subject (e.g. Mathematics)" 
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    disabled={isRunning}
                    className="text-center font-medium bg-muted/30"
                  />
                  <Input 
                    placeholder="What are you working on?" 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isRunning}
                    className="text-center text-sm bg-muted/30"
                  />
                </div>
                
                <div className="flex justify-center gap-4 pt-4">
                  {isRunning ? (
                    <Button size="lg" className="w-36 gap-2 text-lg h-14 rounded-full" onClick={handlePause}>
                      <Pause className="w-5 h-5 fill-current" /> Pause
                    </Button>
                  ) : (
                    <Button size="lg" className="w-36 gap-2 text-lg h-14 rounded-full" onClick={handleStart} disabled={!subject}>
                      <Play className="w-5 h-5 fill-current" /> Start
                    </Button>
                  )}
                  <Button size="lg" variant="outline" className="w-14 h-14 rounded-full p-0" onClick={handleStop} disabled={timeLeft === 25 * 60 && !isRunning}>
                    <Square className="w-5 h-5 fill-current" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                Streak Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-xl text-center">
                  <div className="text-3xl font-bold text-foreground">{streakData?.longest_streak || 0}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1 font-medium">Longest</div>
                </div>
                <div className="p-4 bg-muted/50 rounded-xl text-center">
                  <div className="text-3xl font-bold text-foreground">{streakData?.total_study_days || 0}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1 font-medium">Total Days</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Recent Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pomodoros?.length ? pomodoros.slice(0, 4).map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                    <div>
                      <div className="font-medium text-sm flex items-center gap-2">
                        {p.subject}
                        {p.status === 'completed' && <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{new Date(p.started_at).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm text-primary">{p.total_focus_minutes} min</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{p.pomodoros_completed} blocks</div>
                    </div>
                  </div>
                )) : <div className="text-sm text-muted-foreground text-center py-4">No sessions recorded yet.</div>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
