import { useState } from "react";
import { useListRevisions, useCreateRevision, useMarkRevisionReviewed, useDeleteRevision, getListRevisionsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn, formatDate } from "@/lib/utils";
import { RotateCcw, Plus, Trash2, Star } from "lucide-react";

function ConfidenceStars({ level, onChange }: { level: number; onChange?: (l: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          onClick={() => onChange?.(i)}
          className={cn("transition-colors", onChange ? "cursor-pointer" : "cursor-default")}
          type="button"
        >
          <Star className={cn("w-3.5 h-3.5", i <= level ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
        </button>
      ))}
    </div>
  );
}

export default function RevisionsPage() {
  const qc = useQueryClient();
  const { data: revisions, isLoading } = useListRevisions();
  const createRevision = useCreateRevision();
  const markReviewed = useMarkRevisionReviewed();
  const deleteRevision = useDeleteRevision();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", subject: "", notes: "", confidenceLevel: 3 });
  const [reviewing, setReviewing] = useState<number | null>(null);

  const now = new Date();
  const due = (revisions ?? []).filter(r => new Date(r.nextReviewAt) <= now);
  const upcoming = (revisions ?? []).filter(r => new Date(r.nextReviewAt) > now);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.subject.trim()) return;
    createRevision.mutate(
      { data: { title: form.title, subject: form.subject, notes: form.notes, confidenceLevel: form.confidenceLevel } },
      { onSuccess: () => { qc.invalidateQueries({ queryKey: getListRevisionsQueryKey() }); setShowForm(false); setForm({ title: "", subject: "", notes: "", confidenceLevel: 3 }); } }
    );
  }

  function handleReview(id: number, confidenceLevel: number) {
    markReviewed.mutate(
      { id, data: { confidenceLevel } },
      { onSuccess: () => { qc.invalidateQueries({ queryKey: getListRevisionsQueryKey() }); setReviewing(null); } }
    );
  }

  function RevisionCard({ rev }: { rev: typeof revisions extends (infer U)[] | undefined ? U : never }) {
    if (!rev) return null;
    return (
      <div className="group flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/20 transition-all" data-testid={`revision-${rev.id}`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="text-sm font-semibold text-foreground">{rev.title}</p>
            <button onClick={() => deleteRevision.mutate({ id: rev.id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getListRevisionsQueryKey() }) })} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all shrink-0" data-testid={`delete-revision-${rev.id}`}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mb-1.5">{rev.subject}</p>
          {rev.notes && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{rev.notes}</p>}
          <div className="flex items-center gap-3">
            <ConfidenceStars level={rev.confidenceLevel} />
            <span className="text-[11px] text-muted-foreground">Next: {formatDate(rev.nextReviewAt)}</span>
            <span className="text-[11px] text-muted-foreground">{rev.reviewCount} reviews</span>
          </div>
        </div>
        {reviewing === rev.id ? (
          <div className="flex flex-col items-end gap-2 shrink-0">
            <p className="text-xs text-muted-foreground">Rate confidence:</p>
            <ConfidenceStars level={form.confidenceLevel} onChange={l => setForm(f => ({ ...f, confidenceLevel: l }))} />
            <div className="flex gap-1.5">
              <button onClick={() => handleReview(rev.id, form.confidenceLevel)} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90" data-testid={`confirm-review-${rev.id}`}>Done</button>
              <button onClick={() => setReviewing(null)} className="px-3 py-1.5 rounded-lg border border-border text-xs text-foreground hover:bg-muted">Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setReviewing(rev.id)} className="shrink-0 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors" data-testid={`review-${rev.id}`}>
            Review
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Revisions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{due.length} due · {upcoming.length} upcoming</p>
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity" data-testid="button-add-revision">
          <Plus className="w-4 h-4" /> Add topic
        </button>
      </div>

      {showForm && (
        <div className="mb-5 p-5 border border-border rounded-xl bg-card">
          <h3 className="font-semibold text-foreground mb-4">Add revision topic</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Topic *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Krebs cycle" data-testid="input-revision-title" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Subject *</label>
                <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Biology" data-testid="input-revision-subject" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-foreground mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" placeholder="Key points to remember..." data-testid="input-revision-notes" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Initial confidence</label>
                <ConfidenceStars level={form.confidenceLevel} onChange={l => setForm(f => ({ ...f, confidenceLevel: l }))} />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={createRevision.isPending} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50" data-testid="button-save-revision">
                {createRevision.isPending ? "Adding..." : "Add topic"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-muted">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-24 rounded-xl animate-pulse bg-muted" />)}</div>
      ) : (revisions ?? []).length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <RotateCcw className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No revision topics yet</p>
          <p className="text-sm mt-1">Add topics you need to review</p>
        </div>
      ) : (
        <div className="space-y-5">
          {due.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-rose-500 mb-3">Due for review ({due.length})</p>
              <div className="space-y-2">{due.map(r => <RevisionCard key={r.id} rev={r} />)}</div>
            </div>
          )}
          {upcoming.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Upcoming ({upcoming.length})</p>
              <div className="space-y-2">{upcoming.map(r => <RevisionCard key={r.id} rev={r} />)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
