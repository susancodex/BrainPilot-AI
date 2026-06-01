import { useState } from "react";
import { useListGoals, useCreateGoal, useUpdateGoal, useDeleteGoal, getListGoalsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn, formatDate } from "@/lib/utils";
import { Target, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  paused: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

export default function GoalsPage() {
  const qc = useQueryClient();
  const { data: goals, isLoading } = useListGoals();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", subject: "", description: "", targetDate: "" });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.subject.trim() || !form.targetDate) return;
    createGoal.mutate(
      { data: { title: form.title, subject: form.subject, description: form.description, targetDate: form.targetDate } },
      { onSuccess: () => { qc.invalidateQueries({ queryKey: getListGoalsQueryKey() }); setShowForm(false); setForm({ title: "", subject: "", description: "", targetDate: "" }); } }
    );
  }

  function adjustProgress(id: number, delta: number, current: number) {
    const next = Math.max(0, Math.min(100, current + delta));
    updateGoal.mutate(
      { id, data: { progressPercent: next, status: next === 100 ? "completed" : "active" } },
      { onSuccess: () => qc.invalidateQueries({ queryKey: getListGoalsQueryKey() }) }
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Learning Goals</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{(goals ?? []).filter(g => g.status === "active").length} active goals</p>
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity" data-testid="button-add-goal">
          <Plus className="w-4 h-4" /> Add goal
        </button>
      </div>

      {showForm && (
        <div className="mb-5 p-5 border border-border rounded-xl bg-card">
          <h3 className="font-semibold text-foreground mb-4">New learning goal</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Goal *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Master calculus integration" data-testid="input-goal-title" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Subject *</label>
                <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Mathematics" data-testid="input-goal-subject" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Target date *</label>
                <input type="date" value={form.targetDate} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" data-testid="input-goal-date" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Description</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Optional details..." data-testid="input-goal-desc" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={createGoal.isPending} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50" data-testid="button-save-goal">
                {createGoal.isPending ? "Saving..." : "Add goal"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-muted">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-xl animate-pulse bg-muted" />)}</div>
      ) : (goals ?? []).length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Target className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No goals yet</p>
          <p className="text-sm mt-1">Set a learning goal to stay motivated</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(goals ?? []).map(goal => (
            <div key={goal.id} className={cn("group p-5 rounded-xl border bg-card transition-all hover:shadow-sm", goal.status === "completed" ? "border-emerald-200/50 dark:border-emerald-800/30" : "border-border hover:border-primary/20")} data-testid={`goal-${goal.id}`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="font-semibold text-foreground">{goal.title}</p>
                    <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded", STATUS_COLORS[goal.status] ?? STATUS_COLORS.active)}>{goal.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{goal.subject} · Target: {formatDate(goal.targetDate)}</p>
                  {goal.description && <p className="text-xs text-muted-foreground mt-0.5">{goal.description}</p>}
                </div>
                <button onClick={() => deleteGoal.mutate({ id: goal.id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getListGoalsQueryKey() }) })} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all" data-testid={`delete-goal-${goal.id}`}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all", goal.progressPercent === 100 ? "bg-emerald-500" : "bg-primary")} style={{ width: `${goal.progressPercent}%` }} />
                </div>
                <span className="text-xs font-semibold text-foreground w-9 text-right">{goal.progressPercent}%</span>
                <div className="flex gap-1">
                  <button onClick={() => adjustProgress(goal.id, -10, goal.progressPercent)} disabled={goal.progressPercent <= 0} className="p-1 rounded hover:bg-muted disabled:opacity-30 transition-all" data-testid={`decrease-goal-${goal.id}`}>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button onClick={() => adjustProgress(goal.id, 10, goal.progressPercent)} disabled={goal.progressPercent >= 100} className="p-1 rounded hover:bg-muted disabled:opacity-30 transition-all" data-testid={`increase-goal-${goal.id}`}>
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
