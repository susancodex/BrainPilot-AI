import { useState } from "react";
import { useQuizzes, useGenerateQuiz, useSubmitQuiz, useAttempts } from "@/hooks/use-quizzes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Quiz, QuizQuestion, QuizAttempt } from "@/types";
import {
  BrainCircuit, Play, Plus, CheckCircle2, XCircle, ArrowLeft,
  ArrowRight, Trophy, Clock, RotateCcw, ChevronRight,
  Sparkles, Settings2,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type AppView = "list" | "taking" | "results";

interface SubmitResult {
  score: number;
  total_questions: number;
  percentage: number;
  passed: boolean;
  answers: Array<{
    question_id: string;
    is_correct: boolean;
    correct_answer: string;
    user_answer: string;
    ai_feedback?: string;
  }>;
}

export default function Quizzes() {
  const { data: quizzes, isLoading } = useQuizzes();
  const { data: attempts } = useAttempts();
  const generateQuiz = useGenerateQuiz();
  const submitQuiz = useSubmitQuiz();
  const { toast } = useToast();

  const [view, setView] = useState<AppView>("list");
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<SubmitResult | null>(null);

  const [genForm, setGenForm] = useState({
    topic: "",
    num_questions: [5],
    difficulty: "medium",
  });
  const [genOpen, setGenOpen] = useState(false);

  const quizList = (quizzes as Quiz[] | undefined) ?? [];
  const attemptList = (attempts as QuizAttempt[] | undefined) ?? [];

  const handleGenerate = () => {
    if (!genForm.topic.trim()) return;
    generateQuiz.mutate(
      { topic: genForm.topic, num_questions: genForm.num_questions[0] },
      {
        onSuccess: () => {
          setGenOpen(false);
          setGenForm({ topic: "", num_questions: [5], difficulty: "medium" });
          toast({ title: "Quiz created!", description: `${genForm.num_questions[0]} questions on "${genForm.topic}".` });
        },
      }
    );
  };

  const startQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setCurrentQ(0);
    setAnswers({});
    setResults(null);
    setView("taking");
  };

  const selectAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = () => {
    if (!activeQuiz) return;
    const payload = activeQuiz.questions.map((q) => ({
      question_id: q.id,
      answer: answers[q.id] ?? "",
    }));
    submitQuiz.mutate(
      { id: activeQuiz.id, answers: payload },
      {
        onSuccess: (data: SubmitResult) => {
          setResults(data);
          setView("results");
        },
      }
    );
  };

  const q: QuizQuestion | undefined = activeQuiz?.questions[currentQ];
  const answered = Object.keys(answers).length;
  const total = activeQuiz?.questions.length ?? 0;

  if (view === "taking" && activeQuiz && q) {
    const selectedAnswer = answers[q.id];
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setView("list")} className="gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <span className="text-sm font-medium text-muted-foreground">
            {currentQ + 1} / {total}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-destructive border-destructive/30"
            onClick={() => setView("list")}
          >
            Quit
          </Button>
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <Progress value={((currentQ + 1) / total) * 100} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{activeQuiz.topic}</span>
            <span>{answered} answered</span>
          </div>
        </div>

        {/* Question */}
        <Card className="border-border shadow-md">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0">
                {currentQ + 1}
              </div>
              <CardTitle className="text-lg leading-snug font-medium text-foreground">{q.text}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {q.question_type === "true_false" ? (
              ["True", "False"].map((opt) => (
                <button
                  key={opt}
                  onClick={() => selectAnswer(q.id, opt)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border-2 transition-all font-medium text-sm",
                    selectedAnswer === opt
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card hover:border-primary/40 hover:bg-muted/50"
                  )}
                >
                  {opt}
                </button>
              ))
            ) : q.question_type === "mcq" && q.options ? (
              q.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => selectAnswer(q.id, opt)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border-2 transition-all text-sm flex items-start gap-3",
                    selectedAnswer === opt
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card hover:border-primary/40 hover:bg-muted/50 text-foreground"
                  )}
                >
                  <span className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0",
                    selectedAnswer === opt ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40")}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </button>
              ))
            ) : (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Your answer:</Label>
                <Input
                  value={answers[q.id] ?? ""}
                  onChange={(e) => selectAnswer(q.id, e.target.value)}
                  placeholder="Type your answer..."
                  className="bg-muted/30"
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between gap-3 pt-0">
            <Button
              variant="outline"
              onClick={() => setCurrentQ((p) => Math.max(0, p - 1))}
              disabled={currentQ === 0}
              className="gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Previous
            </Button>
            {currentQ < total - 1 ? (
              <Button onClick={() => setCurrentQ((p) => p + 1)} className="gap-1.5">
                Next <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={submitQuiz.isPending}
                className="gap-1.5 bg-green-600 hover:bg-green-700"
              >
                {submitQuiz.isPending ? "Submitting..." : "Submit Quiz"}
                <CheckCircle2 className="w-4 h-4" />
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Question navigator */}
        <div className="flex flex-wrap gap-2 justify-center">
          {activeQuiz.questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentQ(i)}
              className={cn(
                "w-8 h-8 rounded-full text-xs font-semibold border-2 transition-colors",
                i === currentQ ? "border-primary bg-primary text-primary-foreground" :
                answers[activeQuiz.questions[i].id] ? "border-green-500 bg-green-500/10 text-green-600" :
                "border-border bg-card text-muted-foreground hover:border-primary/40"
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (view === "results" && activeQuiz && results) {
    const pct = results.percentage ?? 0;
    const passed = results.passed;
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Score header */}
        <Card className={cn("border-2 shadow-lg", passed ? "border-green-500/40 bg-green-500/5" : "border-red-500/40 bg-red-500/5")}>
          <CardContent className="pt-8 pb-6 text-center">
            <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-black",
              passed ? "bg-green-500/20 text-green-600" : "bg-red-500/20 text-red-600")}>
              {Math.round(pct)}%
            </div>
            <h2 className={cn("text-2xl font-bold", passed ? "text-green-600" : "text-red-600")}>
              {passed ? "🎉 Passed!" : "Keep Practicing"}
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              {results.score} / {results.total_questions} correct on "{activeQuiz.topic}"
            </p>
            <div className="flex gap-3 justify-center mt-4">
              <Button variant="outline" onClick={() => startQuiz(activeQuiz)} className="gap-1.5">
                <RotateCcw className="w-4 h-4" /> Retry
              </Button>
              <Button onClick={() => setView("list")} className="gap-1.5">
                <ArrowLeft className="w-4 h-4" /> All Quizzes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Per-question breakdown */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Question Review</h3>
          {activeQuiz.questions.map((q, i) => {
            const ans = results.answers?.find((a) => a.question_id === q.id);
            const correct = ans?.is_correct;
            return (
              <Card key={q.id} className={cn("border", correct ? "border-green-500/30" : "border-red-500/30")}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {correct ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{i + 1}. {q.text}</p>
                      <div className="mt-2 space-y-1 text-xs">
                        <div className={cn("px-2 py-1 rounded", correct ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-red-500/10 text-red-700 dark:text-red-400")}>
                          Your answer: {ans?.user_answer || "(no answer)"}
                        </div>
                        {!correct && (
                          <div className="px-2 py-1 rounded bg-green-500/10 text-green-700 dark:text-green-400">
                            Correct: {q.correct_answer}
                          </div>
                        )}
                        {(ans?.ai_feedback || q.explanation) && (
                          <div className="px-2 py-1 rounded bg-muted text-muted-foreground mt-1 italic">
                            {ans?.ai_feedback || q.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Quizzes</h1>
          <p className="text-muted-foreground mt-1">Test your knowledge with AI-generated quizzes.</p>
        </div>
        <Button onClick={() => setGenOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Generate Quiz
        </Button>
      </div>

      {/* Generate dialog */}
      <Dialog open={genOpen} onOpenChange={setGenOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" />Generate AI Quiz</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label>Topic</Label>
              <Input
                value={genForm.topic}
                onChange={(e) => setGenForm({ ...genForm, topic: e.target.value })}
                placeholder="E.g. French Revolution, Machine Learning basics..."
                autoFocus
              />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Number of questions</Label>
                <span className="text-sm font-bold text-primary">{genForm.num_questions[0]}</span>
              </div>
              <Slider min={3} max={20} step={1} value={genForm.num_questions} onValueChange={(v) => setGenForm({ ...genForm, num_questions: v })} />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setGenOpen(false)}>Cancel</Button>
            <Button onClick={handleGenerate} disabled={generateQuiz.isPending || !genForm.topic.trim()} className="gap-2">
              <BrainCircuit className="w-4 h-4" />
              {generateQuiz.isPending ? "Generating..." : "Create Quiz"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats */}
      {attemptList.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Quizzes Taken", value: attemptList.length },
            { label: "Avg Score", value: `${Math.round(attemptList.reduce((s, a) => s + (a.percentage ?? 0), 0) / attemptList.length)}%` },
            { label: "Passed", value: attemptList.filter((a) => a.passed).length },
            { label: "Best Score", value: `${Math.max(...attemptList.map((a) => a.percentage ?? 0))}%` },
          ].map(({ label, value }) => (
            <Card key={label} className="border-border">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quiz list */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : quizList.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizList.map((quiz) => {
            const quizAttempts = attemptList.filter((a) => a.quiz === quiz.id);
            const best = quizAttempts.length ? Math.max(...quizAttempts.map((a) => a.percentage ?? 0)) : null;
            return (
              <Card key={quiz.id} className="border-border flex flex-col hover:border-primary/40 transition-all hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base line-clamp-2">{quiz.topic}</CardTitle>
                    {best !== null && (
                      <Badge variant={best >= 70 ? "default" : "secondary"} className="shrink-0 text-xs">
                        {Math.round(best)}%
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="flex items-center gap-2 text-xs mt-1">
                    <span>{quiz.questions?.length ?? quiz.num_questions} questions</span>
                    {quiz.difficulty && <><span>·</span><span className="capitalize">{quiz.difficulty}</span></>}
                    {quizAttempts.length > 0 && <><span>·</span><span>{quizAttempts.length} attempt{quizAttempts.length !== 1 ? "s" : ""}</span></>}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 pb-0">
                  {best !== null && (
                    <div className="space-y-1">
                      <Progress value={best} className="h-1.5" />
                      <p className="text-[10px] text-muted-foreground">Best: {Math.round(best)}%</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-4">
                  <Button
                    className="w-full gap-2"
                    onClick={() => startQuiz(quiz)}
                    disabled={!quiz.questions?.length}
                  >
                    <Play className="w-4 h-4 fill-current" />
                    {quizAttempts.length > 0 ? "Retake Quiz" : "Start Quiz"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed rounded-2xl text-muted-foreground bg-card">
          <BrainCircuit className="w-14 h-14 mx-auto mb-4 text-muted" />
          <h3 className="text-lg font-medium text-foreground">No quizzes yet</h3>
          <p className="text-sm mt-1">Generate your first AI quiz to start testing your knowledge.</p>
          <Button className="mt-4 gap-2" onClick={() => setGenOpen(true)}>
            <Plus className="w-4 h-4" /> Generate Quiz
          </Button>
        </div>
      )}
    </div>
  );
}
