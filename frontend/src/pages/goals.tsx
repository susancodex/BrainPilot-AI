import { useState } from "react";
import { useGoals, useCreateGoal, useDeleteGoal, useUpdateGoalProgress, useCompleteMilestone } from "@/hooks/use-goals";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Target, CheckCircle2, Circle, Plus, Trash2, Calendar } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Goals() {
  const { data: goals, isLoading } = useGoals();
  const createGoal = useCreateGoal();
  const deleteGoal = useDeleteGoal();
  const updateProgress = useUpdateGoalProgress();
  const completeMilestone = useCompleteMilestone();
  
  const [newGoal, setNewGoal] = useState({ title: "", description: "", target_date: "", subject: "", category: "academic", priority: "medium" });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreate = () => {
    createGoal.mutate(newGoal, {
      onSuccess: () => setIsDialogOpen(false)
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'low': return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
      default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Goals</h1>
          <p className="text-muted-foreground mt-1">Set and track your academic milestones.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={newGoal.title} onChange={e => setNewGoal({...newGoal, title: e.target.value})} placeholder="Master linear algebra" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={newGoal.description} onChange={e => setNewGoal({...newGoal, description: e.target.value})} placeholder="Complete all practice problems" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={newGoal.category} onValueChange={v => setNewGoal({...newGoal, category: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="skill">Skill</SelectItem>
                      <SelectItem value="certification">Certification</SelectItem>
                      <SelectItem value="exam">Exam</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={newGoal.priority} onValueChange={v => setNewGoal({...newGoal, priority: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input value={newGoal.subject} onChange={e => setNewGoal({...newGoal, subject: e.target.value})} placeholder="Math" />
                </div>
                <div className="space-y-2">
                  <Label>Target Date</Label>
                  <Input type="date" value={newGoal.target_date} onChange={e => setNewGoal({...newGoal, target_date: e.target.value})} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={!newGoal.title || createGoal.isPending}>Save Goal</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading goals...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals?.length ? (
            goals.map((goal: any) => (
              <Card key={goal.id} className="border-border flex flex-col shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg leading-tight pr-6">{goal.title}</CardTitle>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive -mr-2 -mt-2 shrink-0"
                      onClick={() => deleteGoal.mutate(goal.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className={`text-[10px] font-medium border px-2 py-0.5 rounded-full ${getPriorityColor(goal.priority)} uppercase tracking-wider`}>
                      {goal.priority}
                    </span>
                    <span className="text-[10px] font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {goal.category}
                    </span>
                    {goal.subject && (
                      <span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {goal.subject}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">{goal.description}</p>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span>{goal.progress}%</span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                    <Slider 
                      defaultValue={[goal.progress]} 
                      max={100} 
                      step={5} 
                      className="mt-2"
                      onValueCommit={([val]) => updateProgress.mutate({ id: goal.id, progress: val })}
                    />
                  </div>

                  {goal.milestone_items && goal.milestone_items.length > 0 && (
                    <div className="space-y-2 mt-4 pt-4 border-t border-border">
                      <div className="text-xs font-semibold text-foreground uppercase tracking-wider">Milestones</div>
                      <div className="space-y-2">
                        {goal.milestone_items.map((ms: any) => (
                          <div key={ms.id} className="flex items-start gap-2 text-sm group">
                            <button 
                              className="mt-0.5 text-muted-foreground hover:text-primary transition-colors shrink-0"
                              onClick={() => !ms.is_completed && completeMilestone.mutate({ goal_id: goal.id, milestone_id: ms.id })}
                              disabled={ms.is_completed || completeMilestone.isPending}
                            >
                              {ms.is_completed ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <Circle className="w-4 h-4" />}
                            </button>
                            <span className={ms.is_completed ? "line-through text-muted-foreground" : "text-foreground"}>
                              {ms.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </CardContent>
                <CardFooter className="pt-4 border-t border-border mt-auto bg-muted/20 flex justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(goal.target_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className={`text-xs font-bold ${goal.status === 'completed' ? 'text-green-500' : 'text-primary'}`}>
                    {goal.status.toUpperCase()}
                  </div>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center p-12 border border-dashed rounded-xl text-muted-foreground">
              <Target className="w-12 h-12 mx-auto mb-4 text-muted" />
              <p>No goals set yet. Aim high!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
