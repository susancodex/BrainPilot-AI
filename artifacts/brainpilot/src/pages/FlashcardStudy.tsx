import { useState } from "react";
import { Link } from "wouter";
import { useGetFlashcardDeck, useCreateFlashcard, useUpdateFlashcard, useDeleteFlashcard, getGetFlashcardDeckQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { ArrowLeft, Plus, RotateCcw, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";

const DIFFICULTIES = ["easy", "medium", "hard"];
const DIFF_COLOR: Record<string, string> = {
  easy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  hard: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
};

export default function FlashcardStudyPage({ id }: { id: number }) {
  const qc = useQueryClient();
  const { data: deck, isLoading } = useGetFlashcardDeck(id, { query: { enabled: !!id, queryKey: getGetFlashcardDeckQueryKey(id) } });
  const createFlashcard = useCreateFlashcard();
  const updateFlashcard = useUpdateFlashcard();
  const deleteFlashcard = useDeleteFlashcard();
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ front: "", back: "", difficulty: "medium" });

  const cards = deck?.cards ?? [];
  const card = cards[cardIndex];

  function handleRateCard(difficulty: string) {
    if (!card) return;
    updateFlashcard.mutate(
      { deckId: id, cardId: card.id, data: { difficulty, reviewCount: card.reviewCount + 1, lastReviewedAt: new Date().toISOString() } },
      { onSuccess: () => { qc.invalidateQueries({ queryKey: getGetFlashcardDeckQueryKey(id) }); setFlipped(false); next(); } }
    );
  }

  function next() { setCardIndex(i => Math.min(i + 1, cards.length - 1)); setFlipped(false); }
  function prev() { setCardIndex(i => Math.max(i - 1, 0)); setFlipped(false); }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.front.trim() || !form.back.trim()) return;
    createFlashcard.mutate(
      { deckId: id, data: { front: form.front, back: form.back, difficulty: form.difficulty } },
      { onSuccess: () => { qc.invalidateQueries({ queryKey: getGetFlashcardDeckQueryKey(id) }); setShowForm(false); setForm({ front: "", back: "", difficulty: "medium" }); } }
    );
  }

  if (isLoading) return <div className="p-6 animate-pulse"><div className="h-8 w-48 bg-muted rounded mb-4" /><div className="h-64 bg-muted rounded-xl" /></div>;
  if (!deck) return <div className="p-6 text-muted-foreground">Deck not found.</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/flashcards">
          <span className="p-1.5 rounded-md hover:bg-muted transition-colors cursor-pointer">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </span>
        </Link>
        <div className="flex-1">
          <h1 className="font-bold text-foreground">{deck.title}</h1>
          <p className="text-xs text-muted-foreground">{deck.subject} · {cards.length} cards</p>
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors" data-testid="button-add-card">
          <Plus className="w-3.5 h-3.5" /> Add card
        </button>
      </div>

      {/* Add card form */}
      {showForm && (
        <div className="mb-5 p-5 border border-border rounded-xl bg-card">
          <h3 className="font-semibold text-foreground mb-3">Add a flashcard</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Front (question)</label>
              <textarea value={form.front} onChange={e => setForm(f => ({ ...f, front: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" placeholder="What is..." data-testid="input-card-front" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Back (answer)</label>
              <textarea value={form.back} onChange={e => setForm(f => ({ ...f, back: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" placeholder="Answer..." data-testid="input-card-back" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Difficulty</label>
              <div className="flex gap-2">
                {DIFFICULTIES.map(d => (
                  <button key={d} type="button" onClick={() => setForm(f => ({ ...f, difficulty: d }))} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all", form.difficulty === d ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-border/80")}>
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={createFlashcard.isPending} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50" data-testid="button-save-card">
                {createFlashcard.isPending ? "Adding..." : "Add card"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-muted">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {cards.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <RotateCcw className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No cards in this deck</p>
          <p className="text-sm mt-1">Add some cards to start studying</p>
        </div>
      ) : (
        <>
          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">Card {cardIndex + 1} of {cards.length}</span>
              {card && <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded", DIFF_COLOR[card.difficulty])}>{card.difficulty}</span>}
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${((cardIndex + 1) / cards.length) * 100}%` }} />
            </div>
          </div>

          {/* Flashcard */}
          {card && (
            <div
              className="relative cursor-pointer select-none"
              onClick={() => setFlipped(f => !f)}
              data-testid="flashcard"
              style={{ perspective: "1000px" }}
            >
              <div className={cn("transition-all duration-500 min-h-48 rounded-2xl border-2 border-border bg-card flex flex-col items-center justify-center p-8 text-center", flipped && "bg-primary/5 border-primary/30")}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">{flipped ? "Answer" : "Question"}</p>
                <p className="text-lg font-medium text-foreground leading-relaxed">{flipped ? card.back : card.front}</p>
                {!flipped && <p className="text-xs text-muted-foreground mt-4">Click to reveal answer</p>}
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-between mt-4">
            <button onClick={prev} disabled={cardIndex === 0} className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-all" data-testid="button-prev">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>

            {flipped && (
              <div className="flex gap-2">
                {DIFFICULTIES.map(d => (
                  <button key={d} onClick={() => handleRateCard(d)} className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-all", DIFF_COLOR[d])} data-testid={`rate-${d}`}>
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              {card && (
                <button
                  onClick={() => deleteFlashcard.mutate({ deckId: id, cardId: card.id }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getGetFlashcardDeckQueryKey(id) }); setCardIndex(i => Math.max(0, i - 1)); } })}
                  className="p-2 rounded-lg border border-border hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                  data-testid="button-delete-card"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button onClick={next} disabled={cardIndex === cards.length - 1} className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-all" data-testid="button-next">
                <ChevronRight className="w-5 h-5 text-foreground" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
