import { useGoals, useCreateGoal, useDeleteGoal } from "@/hooks/use-goals";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Target, CheckCircle2, Circle, Plus, Trash2 } from "lucide-react";

export default function Goals() {
  const { data: goals, isLoading } = useGoals();
  const deleteGoal = useDeleteGoal();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Goals</h1>
          <p className="text-muted-foreground mt-1">Set and track your academic milestones.</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          New Goal
        </Button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading goals...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals?.length ? (
            goals.map((goal: any) => (
              <Card key={goal.id} className="border-border flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg leading-tight">{goal.title}</CardTitle>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive -mr-2 -mt-2"
                      onClick={() => deleteGoal.mutate(goal.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="text-xs font-medium text-primary bg-primary/10 w-fit px-2 py-0.5 rounded-full">
                    {goal.subject}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 text-sm text-muted-foreground">
                  {goal.description}
                  <div className="mt-4 flex items-center gap-2 text-xs font-medium text-foreground">
                    <Target className="w-3 h-3 text-muted-foreground" />
                    Target: {new Date(goal.target_date).toLocaleDateString()}
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button variant={goal.status === "completed" ? "secondary" : "outline"} className="w-full gap-2">
                    {goal.status === "completed" ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                    {goal.status === "completed" ? "Completed" : "Mark Complete"}
                  </Button>
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
