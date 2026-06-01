import { useState } from "react";
import { useDueFlashcards, useReviewFlashcard } from "@/hooks/use-notes";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Check, X, RotateCcw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export default function Flashcards() {
  const { data: flashcards, isLoading } = useDueFlashcards();
  const reviewCard = useReviewFlashcard();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const activeCard = flashcards?.[currentIndex];

  const handleRate = (result: 'correct' | 'incorrect') => {
    if (activeCard) {
      reviewCard.mutate({ id: activeCard.id, result });
      setIsFlipped(false);
      if (currentIndex < (flashcards?.length || 0) - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        // Handled by re-render empty state or similar
      }
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Flashcards</h1>
          <p className="text-muted-foreground mt-1">Review your AI-generated flashcards.</p>
        </div>
        <div className="px-4 py-2 bg-primary/10 text-primary rounded-full font-medium text-sm">
          {flashcards?.length || 0} Due for Review
        </div>
      </div>

      <Tabs defaultValue="review" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="review">Review Due</TabsTrigger>
          <TabsTrigger value="all">All Flashcards</TabsTrigger>
        </TabsList>
        
        <TabsContent value="review" className="flex flex-col items-center">
          {isLoading ? (
            <div className="text-muted-foreground p-12">Loading flashcards...</div>
          ) : flashcards?.length && currentIndex < flashcards.length ? (
            <div className="w-full max-w-2xl">
              <div className="text-center mb-4 text-sm text-muted-foreground font-medium">
                Card {currentIndex + 1} of {flashcards.length}
              </div>
              
              <div 
                className="perspective-1000 relative w-full h-[400px] cursor-pointer group"
                onClick={handleFlip}
              >
                <div className={cn(
                  "w-full h-full transition-all duration-500 transform-style-3d relative",
                  isFlipped ? "rotate-y-180" : ""
                )}>
                  {/* Front */}
                  <Card className="absolute inset-0 backface-hidden flex flex-col justify-center items-center p-8 text-center border-2 hover:border-primary/50 transition-colors shadow-lg">
                    <BrainCircuit className="w-10 h-10 text-muted-foreground mb-6 opacity-20" />
                    <h2 className="text-2xl font-medium leading-relaxed">{activeCard.front}</h2>
                    <p className="absolute bottom-6 text-sm text-muted-foreground">Click to reveal answer</p>
                  </Card>
                  
                  {/* Back */}
                  <Card className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col justify-center items-center p-8 text-center border-2 border-primary/20 bg-primary/5 shadow-lg">
                    <h2 className="text-2xl font-medium leading-relaxed text-foreground">{activeCard.back}</h2>
                  </Card>
                </div>
              </div>

              {isFlipped && (
                <div className="flex gap-4 justify-center mt-8 animate-in slide-in-from-bottom-4 fade-in duration-300">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-40 gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
                    onClick={() => handleRate('incorrect')}
                    disabled={reviewCard.isPending}
                  >
                    <X className="w-5 h-5" /> Incorrect
                  </Button>
                  <Button 
                    size="lg" 
                    className="w-40 gap-2 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleRate('correct')}
                    disabled={reviewCard.isPending}
                  >
                    <Check className="w-5 h-5" /> Correct
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full text-center p-16 border border-dashed rounded-xl text-muted-foreground bg-card">
              <div className="w-16 h-16 bg-primary/10 text-primary flex items-center justify-center rounded-full mx-auto mb-4">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-medium text-foreground mb-2">You're all caught up!</h3>
              <p>No flashcards due for review right now.</p>
              <Button variant="outline" className="mt-6 gap-2" onClick={() => setCurrentIndex(0)}>
                <RotateCcw className="w-4 h-4" /> Restart Review
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Flashcard Library</CardTitle>
              <CardDescription>Browse all your generated flashcards across notes.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground text-center py-12">
                Select a subject to view flashcards.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
