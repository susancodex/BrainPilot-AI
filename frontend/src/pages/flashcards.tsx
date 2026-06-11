import { useState } from "react";
import {
  useDueFlashcards, useReviewFlashcard, useFlashcards,
  useCreateFlashcard, useUpdateFlashcard, useDeleteFlashcard,
} from "@/hooks/use-notes";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Flashcard } from "@/types";
import {
  BrainCircuit, Check, X, RotateCcw, Layers, Eye, Star,
  ChevronLeft, ChevronRight, Plus, Pencil, Trash2,
} from "lucide-react";

export default function Flashcards() {
  const { data: dueCards, isLoading: dueLoading } = useDueFlashcards();
  const { data: allCards, isLoading: allLoading } = useFlashcards();
  const reviewCard = useReviewFlashcard();
  const createCard = useCreateFlashcard();
  const updateCard = useUpdateFlashcard();
  const deleteCard = useDeleteFlashcard();
  const { toast } = useToast();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ question: "", answer: "", subject: "", difficulty: "medium" as "easy" | "medium" | "hard" });

  const [editCard, setEditCard] = useState<Flashcard | null>(null);
  const [editForm, setEditForm] = useState({ question: "", answer: "", subject: "", difficulty: "medium" as "easy" | "medium" | "hard" });

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const cards = (dueCards as Flashcard[] | undefined) ?? [];
  const all = (allCards as Flashcard[] | undefined) ?? [];
  const activeCard = cards[currentIndex];

  const handleRate = (result: "correct" | "incorrect") => {
    if (!activeCard) return;
    reviewCard.mutate({ id: activeCard.id, result });
    const newTotal = sessionTotal + 1;
    const newCorrect = result === "correct" ? sessionCorrect + 1 : sessionCorrect;
    setSessionCorrect(newCorrect);
    setSessionTotal(newTotal);
    setIsFlipped(false);
    setTimeout(() => {
      if (currentIndex < cards.length - 1) {
        setCurrentIndex((p) => p + 1);
      } else {
        setSessionDone(true);
      }
    }, 200);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionCorrect(0);
    setSessionTotal(0);
    setSessionDone(false);
  };

  const handleCreate = () => {
    if (!createForm.question.trim() || !createForm.answer.trim()) return;
    createCard.mutate(
      { question: createForm.question, answer: createForm.answer, subject: createForm.subject || undefined, difficulty: createForm.difficulty },
      {
        onSuccess: () => {
          setCreateOpen(false);
          setCreateForm({ question: "", answer: "", subject: "", difficulty: "medium" });
          toast({ title: "Flashcard created!" });
        },
      }
    );
  };

  const openEdit = (card: Flashcard) => {
    setEditCard(card);
    setEditForm({ question: card.question, answer: card.answer, subject: (card as any).subject ?? "", difficulty: (card.difficulty as any) ?? "medium" });
  };

  const handleEdit = () => {
    if (!editCard) return;
    updateCard.mutate(
      { id: editCard.id, question: editForm.question, answer: editForm.answer, subject: editForm.subject || undefined, difficulty: editForm.difficulty },
      {
        onSuccess: () => {
          setEditCard(null);
          toast({ title: "Flashcard updated!" });
        },
      }
    );
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteCard.mutate(deleteId, {
      onSuccess: () => {
        setDeleteId(null);
        toast({ title: "Flashcard deleted" });
      },
    });
  };

  const progress = cards.length ? ((currentIndex) / cards.length) * 100 : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Flashcards</h1>
          <p className="text-muted-foreground mt-1">Review your AI-generated flashcards with spaced repetition.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-primary/10 text-primary rounded-full font-semibold text-sm flex items-center gap-2">
            <Layers className="w-4 h-4" />
            {cards.length} Due
          </div>
          {all.length > 0 && (
            <div className="px-4 py-2 bg-muted text-muted-foreground rounded-full font-medium text-sm">
              {all.length} Total
            </div>
          )}
          <Button size="sm" className="gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" /> New Card
          </Button>
        </div>
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Flashcard</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Question <span className="text-destructive">*</span></Label>
              <Textarea value={createForm.question} onChange={(e) => setCreateForm({ ...createForm, question: e.target.value })} placeholder="Enter the question..." rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Answer <span className="text-destructive">*</span></Label>
              <Textarea value={createForm.answer} onChange={(e) => setCreateForm({ ...createForm, answer: e.target.value })} placeholder="Enter the answer..." rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input value={createForm.subject} onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })} placeholder="E.g. Biology..." />
              </div>
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select value={createForm.difficulty} onValueChange={(v) => setCreateForm({ ...createForm, difficulty: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createCard.isPending || !createForm.question.trim() || !createForm.answer.trim()}>
              {createCard.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editCard} onOpenChange={(o) => !o && setEditCard(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Flashcard</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Question</Label>
              <Textarea value={editForm.question} onChange={(e) => setEditForm({ ...editForm, question: e.target.value })} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Answer</Label>
              <Textarea value={editForm.answer} onChange={(e) => setEditForm({ ...editForm, answer: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input value={editForm.subject} onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })} placeholder="E.g. Biology..." />
              </div>
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select value={editForm.difficulty} onValueChange={(v) => setEditForm({ ...editForm, difficulty: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCard(null)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={updateCard.isPending}>
              {updateCard.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Flashcard?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Tabs defaultValue="review" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="review">Review Due</TabsTrigger>
          <TabsTrigger value="all">All Cards</TabsTrigger>
        </TabsList>

        <TabsContent value="review">
          {dueLoading ? (
            <div className="flex justify-center py-12">
              <Skeleton className="w-full max-w-xl h-64 rounded-2xl" />
            </div>
          ) : sessionDone ? (
            <div className="max-w-md mx-auto text-center py-12">
              <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-black",
                sessionCorrect / sessionTotal >= 0.7 ? "bg-green-500/20 text-green-600" : "bg-orange-500/20 text-orange-600")}>
                {Math.round((sessionCorrect / sessionTotal) * 100)}%
              </div>
              <h3 className="text-2xl font-bold text-foreground">Session Complete!</h3>
              <p className="text-muted-foreground mt-2">{sessionCorrect} / {sessionTotal} correct</p>
              <div className="flex gap-3 justify-center mt-6">
                <Button variant="outline" onClick={handleRestart} className="gap-2">
                  <RotateCcw className="w-4 h-4" /> Restart
                </Button>
              </div>
            </div>
          ) : cards.length > 0 ? (
            <div className="flex flex-col items-center w-full">
              <div className="w-full max-w-xl mb-4 space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Card {currentIndex + 1} of {cards.length}</span>
                  <span>{sessionCorrect} correct</span>
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>

              <div className="perspective-1000 relative w-full max-w-xl h-72 cursor-pointer select-none" onClick={() => setIsFlipped((f) => !f)}>
                <div className={cn("w-full h-full transform-style-3d transition-all duration-500 relative", isFlipped && "rotate-y-180")}>
                  <Card className="absolute inset-0 backface-hidden flex flex-col justify-center items-center p-8 text-center border-2 hover:border-primary/40 transition-colors shadow-lg">
                    <div className="absolute top-4 left-4"><Badge variant="secondary" className="text-xs">Front</Badge></div>
                    <BrainCircuit className="w-8 h-8 text-muted-foreground/30 mb-4" />
                    <h2 className="text-xl font-semibold leading-relaxed text-foreground">{activeCard?.question}</h2>
                    <p className="absolute bottom-4 text-xs text-muted-foreground flex items-center gap-1"><Eye className="w-3 h-3" /> Click to reveal</p>
                  </Card>
                  <Card className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col justify-center items-center p-8 text-center border-2 border-primary/30 bg-primary/5 shadow-lg">
                    <div className="absolute top-4 left-4"><Badge className="text-xs bg-primary/20 text-primary border-primary/30">Answer</Badge></div>
                    <h2 className="text-xl font-semibold leading-relaxed text-foreground">{activeCard?.answer}</h2>
                  </Card>
                </div>
              </div>

              <div className={cn("flex gap-4 justify-center mt-6 transition-all duration-300", isFlipped ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none")}>
                <Button variant="outline" size="lg" className="w-40 gap-2 border-destructive/50 text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); handleRate("incorrect"); }} disabled={reviewCard.isPending}>
                  <X className="w-5 h-5" /> Incorrect
                </Button>
                <Button size="lg" className="w-40 gap-2 bg-green-600 hover:bg-green-700 text-white" onClick={(e) => { e.stopPropagation(); handleRate("correct"); }} disabled={reviewCard.isPending}>
                  <Check className="w-5 h-5" /> Correct
                </Button>
              </div>

              <div className="flex items-center gap-4 mt-4">
                <Button variant="ghost" size="sm" onClick={() => { setCurrentIndex((p) => Math.max(0, p - 1)); setIsFlipped(false); }} disabled={currentIndex === 0}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex gap-1.5">
                  {cards.slice(0, 10).map((_, i) => (
                    <div key={i} className={cn("w-2 h-2 rounded-full transition-colors", i === currentIndex ? "bg-primary" : i < currentIndex ? "bg-primary/40" : "bg-muted-foreground/20")} />
                  ))}
                  {cards.length > 10 && <span className="text-xs text-muted-foreground">+{cards.length - 10}</span>}
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setCurrentIndex((p) => Math.min(cards.length - 1, p + 1)); setIsFlipped(false); }} disabled={currentIndex >= cards.length - 1}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 border border-dashed rounded-2xl text-muted-foreground bg-card max-w-xl mx-auto">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">All caught up!</h3>
              <p className="text-sm">No flashcards due for review right now.</p>
              <p className="text-xs text-muted-foreground mt-1">Generate flashcards from your notes to start reviewing.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="all">
          {allLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
            </div>
          ) : all.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {all.map((card) => (
                <Card key={card.id} className="border-border hover:border-primary/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="p-3 bg-muted/40 rounded-lg">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Question</p>
                        <p className="text-sm font-medium text-foreground">{card.question}</p>
                      </div>
                      <div className="p-3 bg-primary/5 border border-primary/10 rounded-lg">
                        <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Answer</p>
                        <p className="text-sm text-foreground">{card.answer}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Reviewed {card.times_reviewed} times</span>
                        {card.difficulty && <Badge variant="outline" className="text-[10px]">{card.difficulty}</Badge>}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => openEdit(card)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(card.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed rounded-2xl text-muted-foreground">
              <Layers className="w-12 h-12 mx-auto mb-3 text-muted" />
              <p className="mb-3">No flashcards yet. Generate some from your notes or create one manually.</p>
              <Button size="sm" className="gap-2" onClick={() => setCreateOpen(true)}>
                <Plus className="w-4 h-4" /> Create Flashcard
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
