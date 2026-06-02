import { useState } from "react";
import { useDueFlashcards, useReviewFlashcard, useFlashcards } from "@/hooks/use-notes";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { Flashcard } from "@/types";
import {
  BrainCircuit, Check, X, RotateCcw, Layers, Eye, Star,
  ChevronLeft, ChevronRight,
} from "lucide-react";

export default function Flashcards() {
  const { data: dueCards, isLoading: dueLoading } = useDueFlashcards();
  const { data: allCards, isLoading: allLoading } = useFlashcards();
  const reviewCard = useReviewFlashcard();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);

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
        </div>
      </div>

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
              <p className="text-muted-foreground mt-2">
                {sessionCorrect} / {sessionTotal} correct
              </p>
              <div className="flex gap-3 justify-center mt-6">
                <Button variant="outline" onClick={handleRestart} className="gap-2">
                  <RotateCcw className="w-4 h-4" /> Restart
                </Button>
              </div>
            </div>
          ) : cards.length > 0 ? (
            <div className="flex flex-col items-center w-full">
              {/* Progress */}
              <div className="w-full max-w-xl mb-4 space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Card {currentIndex + 1} of {cards.length}</span>
                  <span>{sessionCorrect} correct</span>
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>

              {/* Card */}
              <div
                className="perspective-1000 relative w-full max-w-xl h-72 cursor-pointer select-none"
                onClick={() => setIsFlipped((f) => !f)}
              >
                <div className={cn(
                  "w-full h-full transform-style-3d transition-all duration-500 relative",
                  isFlipped && "rotate-y-180"
                )}>
                  {/* Front */}
                  <Card className="absolute inset-0 backface-hidden flex flex-col justify-center items-center p-8 text-center border-2 hover:border-primary/40 transition-colors shadow-lg">
                    <div className="absolute top-4 left-4">
                      <Badge variant="secondary" className="text-xs">Front</Badge>
                    </div>
                    <BrainCircuit className="w-8 h-8 text-muted-foreground/30 mb-4" />
                    <h2 className="text-xl font-semibold leading-relaxed text-foreground">{activeCard?.front}</h2>
                    <p className="absolute bottom-4 text-xs text-muted-foreground flex items-center gap-1">
                      <Eye className="w-3 h-3" /> Click to reveal
                    </p>
                  </Card>

                  {/* Back */}
                  <Card className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col justify-center items-center p-8 text-center border-2 border-primary/30 bg-primary/5 shadow-lg">
                    <div className="absolute top-4 left-4">
                      <Badge className="text-xs bg-primary/20 text-primary border-primary/30">Answer</Badge>
                    </div>
                    <h2 className="text-xl font-semibold leading-relaxed text-foreground">{activeCard?.back}</h2>
                  </Card>
                </div>
              </div>

              {/* Rating buttons */}
              <div className={cn(
                "flex gap-4 justify-center mt-6 transition-all duration-300",
                isFlipped ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
              )}>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-40 gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
                  onClick={(e) => { e.stopPropagation(); handleRate("incorrect"); }}
                  disabled={reviewCard.isPending}
                >
                  <X className="w-5 h-5" /> Incorrect
                </Button>
                <Button
                  size="lg"
                  className="w-40 gap-2 bg-green-600 hover:bg-green-700 text-white"
                  onClick={(e) => { e.stopPropagation(); handleRate("correct"); }}
                  disabled={reviewCard.isPending}
                >
                  <Check className="w-5 h-5" /> Correct
                </Button>
              </div>

              {/* Navigation */}
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
                        <p className="text-sm font-medium text-foreground">{card.front}</p>
                      </div>
                      <div className="p-3 bg-primary/5 border border-primary/10 rounded-lg">
                        <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Answer</p>
                        <p className="text-sm text-foreground">{card.back}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                      <span>Reviewed {card.review_count} times</span>
                      {card.difficulty && (
                        <Badge variant="outline" className="text-[10px]">{card.difficulty}</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed rounded-2xl text-muted-foreground">
              <Layers className="w-12 h-12 mx-auto mb-3 text-muted" />
              <p>No flashcards yet. Generate some from your notes!</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
