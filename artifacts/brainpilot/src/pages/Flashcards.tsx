import { useState } from "react";
import { Link } from "wouter";
import { useListFlashcardDecks, useCreateFlashcardDeck, useDeleteFlashcardDeck, getListFlashcardDecksQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { BookOpen, Plus, Trash2, ChevronRight } from "lucide-react";

const DECK_COLORS = ["bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-cyan-500"];

export default function FlashcardsPage() {
  const qc = useQueryClient();
  const { data: decks, isLoading } = useListFlashcardDecks();
  const createDeck = useCreateFlashcardDeck();
  const deleteDeck = useDeleteFlashcardDeck();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", subject: "", description: "", color: DECK_COLORS[0] });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.subject.trim()) return;
    createDeck.mutate(
      { data: { title: form.title, subject: form.subject, description: form.description, color: form.color } },
      { onSuccess: () => { qc.invalidateQueries({ queryKey: getListFlashcardDecksQueryKey() }); setShowForm(false); setForm({ title: "", subject: "", description: "", color: DECK_COLORS[0] }); } }
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Flashcards</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{(decks ?? []).length} decks</p>
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity" data-testid="button-new-deck">
          <Plus className="w-4 h-4" /> New deck
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-5 border border-border rounded-xl bg-card">
          <h3 className="font-semibold text-foreground mb-4">Create flashcard deck</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Deck name *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Cell Biology" data-testid="input-deck-title" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Subject *</label>
                <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Biology" data-testid="input-deck-subject" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-foreground mb-1">Description</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Optional description..." data-testid="input-deck-desc" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Color</label>
                <div className="flex gap-2">
                  {DECK_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))} className={cn("w-6 h-6 rounded-full transition-all", c, form.color === c ? "ring-2 ring-offset-2 ring-foreground scale-110" : "")} />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={createDeck.isPending} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50" data-testid="button-create-deck">
                {createDeck.isPending ? "Creating..." : "Create deck"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-muted transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="h-40 rounded-xl animate-pulse bg-muted" />)}</div>
      ) : (decks ?? []).length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No flashcard decks yet</p>
          <p className="text-sm mt-1">Create your first deck to start studying</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(decks ?? []).map(deck => {
            const progress = deck.cardCount > 0 ? Math.round((deck.masteredCount / deck.cardCount) * 100) : 0;
            return (
              <div key={deck.id} className="group relative bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 hover:shadow-md transition-all" data-testid={`deck-${deck.id}`}>
                <div className={cn("h-2", deck.color ?? "bg-primary")} />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-semibold text-foreground">{deck.title}</p>
                    <button
                      onClick={() => deleteDeck.mutate({ id: deck.id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getListFlashcardDecksQueryKey() }) })}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                      data-testid={`delete-deck-${deck.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{deck.subject}{deck.description && ` · ${deck.description}`}</p>
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-muted-foreground">{deck.masteredCount}/{deck.cardCount} mastered</span>
                      <span className="text-[11px] font-medium text-foreground">{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <Link href={`/flashcards/${deck.id}`}>
                    <span className="flex items-center justify-between text-xs font-medium text-primary hover:underline cursor-pointer">
                      Study {deck.cardCount} cards <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
