import { useEffect, useRef, useState } from "react";
import { useTimerStore } from "@/store/timer";
import { useCompleteSession, useStartPomodoro, useStreak, usePomodoro, useDeletePomodoro } from "@/hooks/use-productivity";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { PomodoroSession, StudyStreak } from "@/types";
import {
  Play, Pause, RotateCcw, Flame, Timer, CheckCircle,
  Coffee, Clock, Settings2, Trash2,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";

const RADIUS = 120;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function Productivity() {
  const timer = useTimerStore();
  const { toast } = useToast();
  const startPomodoro = useStartPomodoro();
  const completeSession = useCompleteSession();
  const deletePomodoro = useDeletePomodoro();
  const { data: streakData } = useStreak();
  const { data: pomodoros } = usePomodoro();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const streak = streakData as StudyStreak | undefined;
  const sessions = (pomodoros as PomodoroSession[] | undefined) ?? [];

  useEffect(() => {
    if (timer.status === "running") {
      intervalRef.current = setInterval(() => {
        const done = timer.tick();
        if (done) {
          handleTimerComplete();
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timer.status]);

  const handleTimerComplete = () => {
    if (timer.mode === "focus") {
      timer.incrementPomodoros();
      completeSession.mutate(
        { subject: timer.subject || "General", focus_minutes: timer.focusMinutes, task_description: timer.description || undefined },
        { onSuccess: () => { toast({ title: "Session complete! 🎉", description: `${timer.focusMinutes} minutes of focus logged.` }); } }
      );
    } else {
      toast({ title: "Break over!", description: "Time to get back to work." });
    }
  };

  const handleStart = () => {
    if (!timer.subject.trim()) {
      toast({ title: "Subject required", description: "Enter what you're studying.", variant: "destructive" });
      return;
    }
    if (timer.mode === "focus" && timer.status === "idle" && timer.secondsLeft === timer.focusMinutes * 60) {
      startPomodoro.mutate({
        subject: timer.subject,
        task_description: timer.description || undefined,
        work_duration_minutes: timer.focusMinutes,
        break_duration_minutes: timer.shortBreakMinutes,
      });
    }
    timer.start();
  };

  const handleDeleteConfirm = () => {
    if (!deleteId) return;
    deletePomodoro.mutate(deleteId, {
      onSuccess: () => {
        setDeleteId(null);
        toast({ title: "Session deleted" });
      },
    });
  };

  const progress = timer.getProgressPercent();
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress / 100);

  const modeColors: Record<string, string> = {
    focus: "text-primary stroke-primary",
    short_break: "text-green-500 stroke-green-500",
    long_break: "text-blue-500 stroke-blue-500",
  };
  const modeColor = modeColors[timer.mode] || modeColors.focus;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Focus Mode</h1>
          <p className="text-muted-foreground mt-1">Deep work sessions and productivity tracking.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-full font-bold text-sm">
            <Flame className="w-4 h-4 fill-current" />
            {streak?.current_streak ?? 0} Day Streak
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <Settings2 className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Timer Settings</DialogTitle></DialogHeader>
              <div className="space-y-5 py-2">
                {[
                  { label: "Focus", key: "focusMinutes" as const, min: 5, max: 90 },
                  { label: "Short Break", key: "shortBreakMinutes" as const, min: 1, max: 30 },
                  { label: "Long Break", key: "longBreakMinutes" as const, min: 5, max: 60 },
                ].map(({ label, key }) => (
                  <div key={key} className="space-y-3">
                    <div className="flex justify-between">
                      <Label>{label} Duration</Label>
                      <span className="font-bold text-primary text-sm">{timer[key]} min</span>
                    </div>
                    <Slider
                      min={1} max={120} step={1} value={[timer[key]]}
                      onValueChange={([v]) => {
                        const { focusMinutes, shortBreakMinutes, longBreakMinutes } = timer;
                        timer.setDurations(
                          key === "focusMinutes" ? v : focusMinutes,
                          key === "shortBreakMinutes" ? v : shortBreakMinutes,
                          key === "longBreakMinutes" ? v : longBreakMinutes,
                        );
                      }}
                      disabled={timer.status === "running"}
                    />
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Session?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this focus session from your history.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Timer */}
        <div className="lg:col-span-7">
          <Card className="border-border shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit mx-auto">
                {(["focus", "short_break", "long_break"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => timer.setMode(mode)}
                    disabled={timer.status === "running"}
                    className={cn(
                      "px-4 py-1.5 rounded-md text-xs font-semibold transition-colors",
                      timer.mode === mode ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {mode === "focus" ? "Focus" : mode === "short_break" ? "Short Break" : "Long Break"}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-6">
              <div className="relative w-64 h-64 flex items-center justify-center mb-8">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="128" cy="128" r={RADIUS} className="stroke-muted fill-none" strokeWidth="10" />
                  <circle cx="128" cy="128" r={RADIUS} className={cn("fill-none transition-all duration-1000 ease-linear", modeColor)} strokeWidth="10" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className={cn("text-6xl font-bold tabular-nums tracking-tighter", timer.status === "running" ? modeColor.split(" ")[0] : "text-foreground")}>
                    {formatTime(timer.secondsLeft)}
                  </span>
                  <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mt-1 flex items-center gap-1">
                    {timer.mode === "focus" ? <><Timer className="w-3 h-3" /> Focus</> : <><Coffee className="w-3 h-3" /> Break</>}
                  </span>
                  {timer.pomodorosCompleted > 0 && (
                    <div className="flex gap-1 mt-2">
                      {Array.from({ length: Math.min(timer.pomodorosCompleted, 8) }).map((_, i) => (
                        <div key={i} className="w-2 h-2 rounded-full bg-primary" />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full max-w-xs space-y-3 mb-6">
                <Input placeholder="What subject are you studying?" value={timer.subject} onChange={(e) => timer.setSubject(e.target.value)} disabled={timer.status === "running"} className="text-center font-medium" />
                <Input placeholder="Task description (optional)" value={timer.description} onChange={(e) => timer.setDescription(e.target.value)} disabled={timer.status === "running"} className="text-center text-sm" />
              </div>

              <div className="flex items-center gap-4">
                {timer.status === "running" ? (
                  <Button size="lg" className="w-36 h-14 rounded-full text-base gap-2" onClick={timer.pause}>
                    <Pause className="w-5 h-5 fill-current" /> Pause
                  </Button>
                ) : (
                  <Button size="lg" className="w-36 h-14 rounded-full text-base gap-2" onClick={handleStart} disabled={!timer.subject.trim()}>
                    <Play className="w-5 h-5 fill-current" /> {timer.status === "paused" ? "Resume" : "Start"}
                  </Button>
                )}
                <Button size="lg" variant="outline" className="w-14 h-14 rounded-full p-0" onClick={timer.reset} disabled={timer.status === "idle" && timer.secondsLeft === timer.getTotalSeconds()}>
                  <RotateCcw className="w-5 h-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats sidebar */}
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" /> Streak Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Current", value: streak?.current_streak ?? 0 },
                  { label: "Longest", value: streak?.longest_streak ?? 0 },
                  { label: "Total Days", value: streak?.total_study_days ?? 0 },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 bg-muted/50 rounded-xl text-center">
                    <div className="text-2xl font-bold">{value}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5 font-medium">{label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> Recent Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {sessions.length ? (
                  sessions.slice(0, 5).map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card group">
                      <div>
                        <div className="font-medium text-sm flex items-center gap-1.5">
                          {p.subject}
                          {p.status === "completed" && <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {new Date(p.started_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="font-bold text-sm text-primary">{p.total_focus_minutes}m</div>
                          <div className="text-[10px] text-muted-foreground">{p.pomodoros_completed} 🍅</div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setDeleteId(p.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-6">
                    <Timer className="w-8 h-8 mx-auto mb-2 text-muted" />
                    No sessions yet. Start your first one!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
