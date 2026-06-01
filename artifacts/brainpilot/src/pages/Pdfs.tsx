import { useState } from "react";
import { useListPdfs, useCreatePdf, useDeletePdf, getListPdfsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn, formatDate } from "@/lib/utils";
import { FileText, Plus, Trash2 } from "lucide-react";

export default function PdfsPage() {
  const qc = useQueryClient();
  const { data: pdfs, isLoading } = useListPdfs();
  const createPdf = useCreatePdf();
  const deletePdf = useDeletePdf();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", filename: "", pageCount: "", subject: "", notes: "" });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.filename.trim() || !form.pageCount) return;
    createPdf.mutate(
      { data: { title: form.title, filename: form.filename, pageCount: Number(form.pageCount), subject: form.subject, notes: form.notes } },
      { onSuccess: () => { qc.invalidateQueries({ queryKey: getListPdfsQueryKey() }); setShowForm(false); setForm({ title: "", filename: "", pageCount: "", subject: "", notes: "" }); } }
    );
  }

  const SUBJECT_COLORS: Record<string, string> = {
    Biology: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    Chemistry: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    Physics: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
    Mathematics: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    History: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">PDF Library</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{(pdfs ?? []).length} documents</p>
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity" data-testid="button-add-pdf">
          <Plus className="w-4 h-4" /> Add PDF
        </button>
      </div>

      {showForm && (
        <div className="mb-5 p-5 border border-border rounded-xl bg-card">
          <h3 className="font-semibold text-foreground mb-4">Add PDF document</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Lecture Notes Ch.5" data-testid="input-pdf-title" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Filename *</label>
                <input value={form.filename} onChange={e => setForm(f => ({ ...f, filename: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="chapter5.pdf" data-testid="input-pdf-filename" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Pages *</label>
                <input type="number" min={1} value={form.pageCount} onChange={e => setForm(f => ({ ...f, pageCount: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="20" data-testid="input-pdf-pages" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Subject</label>
                <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Biology" data-testid="input-pdf-subject" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-foreground mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" placeholder="Covers sections 5.1 – 5.4..." data-testid="input-pdf-notes" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={createPdf.isPending} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50" data-testid="button-save-pdf">
                {createPdf.isPending ? "Saving..." : "Add document"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-muted">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-36 rounded-xl animate-pulse bg-muted" />)}</div>
      ) : (pdfs ?? []).length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No PDFs yet</p>
          <p className="text-sm mt-1">Add your lecture notes and textbooks</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {(pdfs ?? []).map(pdf => (
            <div key={pdf.id} className="group bg-card border border-border rounded-xl p-5 hover:border-primary/20 hover:shadow-sm transition-all" data-testid={`pdf-${pdf.id}`}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-foreground text-sm truncate">{pdf.title}</p>
                    <button onClick={() => deletePdf.mutate({ id: pdf.id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getListPdfsQueryKey() }) })} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all shrink-0" data-testid={`delete-pdf-${pdf.id}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">{pdf.filename} · {pdf.pageCount} pages</p>
                  {pdf.subject && (
                    <span className={cn("inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded mt-1.5", SUBJECT_COLORS[pdf.subject] ?? "bg-muted text-muted-foreground")}>
                      {pdf.subject}
                    </span>
                  )}
                  {pdf.notes && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{pdf.notes}</p>}
                  <p className="text-[11px] text-muted-foreground mt-2">Added {formatDate(pdf.uploadedAt)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
