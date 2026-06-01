import { useState } from "react";
import { useListTasks, useCreateTask, useCompleteTask, useDeleteTask, getListTasksQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn, formatDate } from "@/lib/utils";
import { Plus, CheckCircle2, Circle, Trash2, Calendar, Clock } from "lucide-react";

const PRIORITIES = ["low", "medium", "high"];
const PRIORITY_COLOR: Record<string, string> = {
  high: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
  medium: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  low: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
};

export default function PlannerPage() {
  const qc = useQueryClient();
  const { data: tasks, isLoading } = useListTasks();
  const createTask = useCreateTask();
  const completeTask = useCompleteTask();
  const deleteTask = useDeleteTask();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", subject: "", dueDate: "", priority: "medium", estimatedMinutes: "" });
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  const filtered = (tasks ?? []).filter(t => filter === "all" || t.status === filter);
  const pending = (tasks ?? []).filter(t => t.status === "pending").length;
  const completed = (tasks ?? []).filter(t => t.status === "completed").length;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.subject.trim() || !form.dueDate) return;
    createTask.mutate(
      { data: { title: form.title, subject: form.subject, dueDate: form.dueDate, priority: form.priority, estimatedMinutes: form.estimatedMinutes ? Number(form.estimatedMinutes) : undefined } },
      { onSuccess: () => { qc.invalidateQueries({ queryKey: getListTasksQueryKey() }); setShowForm(false); setForm({ title: "", subject: "", dueDate: "", priority: "medium", estimatedMinutes: "" }); } }
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Study Planner</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{pending} pending · {completed} completed</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          data-testid="button-add-task"
        >
          <Plus className="w-4 h-4" /> Add task
        </button>
      </div>

      {/* Add task form */}
      {showForm && (
        <div className="mb-5 p-5 border border-border rounded-xl bg-card">
          <h3 className="font-semibold text-foreground mb-4">New task</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Task title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Study chapter 5..." data-testid="input-task-title" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Subject *</label>
                <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Biology" data-testid="input-task-subject" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Due date *</label>
                <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" data-testid="input-task-due" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Priority</label>
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" data-testid="select-priority">
                  {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Est. minutes</label>
                <input type="number" min={1} value={form.estimatedMinutes} onChange={e => setForm(f => ({ ...f, estimatedMinutes: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="60" data-testid="input-task-minutes" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={createTask.isPending} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50" data-testid="button-save-task">
                {createTask.isPending ? "Saving..." : "Add task"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-muted transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-muted mb-5 w-fit">
        {(["all", "pending", "completed"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all", filter === f ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")} data-testid={`filter-${f}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Tasks */}
      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl animate-pulse bg-muted" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No tasks here</p>
          <p className="text-sm mt-1">Add a study task to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => (
            <div key={task.id} className={cn("flex items-center gap-3 p-4 rounded-xl border transition-all group", task.status === "completed" ? "bg-muted/30 border-border/50 opacity-70" : "bg-card border-border hover:border-primary/20 hover:shadow-sm")} data-testid={`task-${task.id}`}>
              <button
                onClick={() => task.status === "pending" && completeTask.mutate({ id: task.id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getListTasksQueryKey() }) })}
                className="shrink-0"
                data-testid={`complete-task-${task.id}`}
              >
                {task.status === "completed"
                  ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  : <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium text-foreground truncate", task.status === "completed" && "line-through text-muted-foreground")}>{task.title}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-muted-foreground">{task.subject}</span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" /> {task.dueDate}
                  </div>
                  {task.estimatedMinutes && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" /> {task.estimatedMinutes}m
                    </div>
                  )}
                </div>
              </div>
              <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0", PRIORITY_COLOR[task.priority])}>{task.priority}</span>
              <button
                onClick={() => deleteTask.mutate({ id: task.id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getListTasksQueryKey() }) })}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                data-testid={`delete-task-${task.id}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
