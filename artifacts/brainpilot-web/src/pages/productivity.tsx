import { useState, useEffect } from "react";
import { useCompleteSession, useStreak } from "@/hooks/use-productivity";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Play, Pause, Square, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export default function Productivity() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [subject, setSubject] = useState("");
  const completeSession = useCompleteSession();
  const { data: streakData } = useStreak();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      completeSession.mutate({ duration_minutes: 25, subject });
      // Play sound or notification here
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft, completeSession, subject]);

  const toggleTimer = () => setIsRunning(!isRunning);
  
  const resetTimer = () => {
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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Productivity</h1>
          <p className="text-muted-foreground mt-1">Focus sessions and streak tracking.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 text-orange-500 rounded-full font-bold">
          <Flame className="w-5 h-5" fill="currentColor" />
          {streakData?.streak || 0} Day Streak
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardHeader className="text-center">
            <CardTitle>Pomodoro Timer</CardTitle>
            <CardDescription>Stay focused for 25 minutes</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-8">
            <div className="relative w-64 h-64 flex items-center justify-center mb-8">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  className="stroke-muted fill-none"
                  strokeWidth="8"
                />
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  className="stroke-primary fill-none transition-all duration-1000 ease-linear"
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 120}
                  strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className={cn(
                  "text-6xl font-bold tabular-nums tracking-tighter",
                  isRunning ? "text-primary" : "text-foreground"
                )}>
                  {formatTime(timeLeft)}
                </span>
                <span className="text-sm text-muted-foreground mt-2 uppercase tracking-widest font-semibold">
                  Focus
                </span>
              </div>
            </div>

            <div className="w-full max-w-xs space-y-4">
              <Input 
                placeholder="What are you working on?" 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={isRunning}
                className="text-center bg-muted/50"
              />
              <div className="flex justify-center gap-4">
                <Button 
                  size="lg" 
                  className="w-32 gap-2 text-lg h-14 rounded-full"
                  onClick={toggleTimer}
                >
                  {isRunning ? (
                    <><Pause className="w-5 h-5 fill-current" /> Pause</>
                  ) : (
                    <><Play className="w-5 h-5 fill-current" /> Start</>
                  )}
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-14 h-14 rounded-full p-0"
                  onClick={resetTimer}
                  disabled={timeLeft === 25 * 60 && !isRunning}
                >
                  <Square className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
