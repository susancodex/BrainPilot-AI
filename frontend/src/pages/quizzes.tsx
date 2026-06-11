import { useState, useRef } from "react";
import { useQuizzes, useGenerateQuiz, useSubmitQuiz, useAttempts, useDeleteQuiz, useUpdateQuiz } from "@/hooks/use-quizzes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Quiz, QuizAttempt } from "@/types";
import {
  BrainCircuit, Play, Plus, CheckCircle2, XCircle, ArrowLeft,
  ArrowRight, RotateCcw, Sparkles, Trash2, Pencil, MoreHorizontal,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import type { QuizQuestion } from "@/types";

type AppView = "list" | "taking" | "results";

function getQuestionText(q: QuizQuestion): string {
  return q.question ?? q.text ?? "";
}

function getQuestionIndex(q: QuizQuestion, fallback: number): number {
  return typeof q.index === "number" ? q.index : fallback;
}

export default function Quizzes() {
  const { data: quizzes, isLoading } = useQuizzes();
  const { data: attempts } = useAttempts();
  const generateQuiz = useGenerateQuiz();
  const submitQuiz = useSubmitQuiz();
  const deleteQuiz = useDeleteQuiz();
  const updateQuiz = useUpdateQuiz();
  const { toast } = useToast();

  const [view, setView] = useState<AppView>("list");
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [results, setResults] = useState<QuizAttempt | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const [genForm, setGenForm] = useState({ subject: "", topic: "", question_count: [5], difficulty: "medium" });
  const [genOpen, setGenOpen] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editQuiz, setEditQuiz] = useState<Quiz | null>(null);
  const [editForm, setEditForm] = useState({ title: "", subject: "", difficulty: "medium" });

  const quizList = (quizzes as Quiz[] | undefined) ?? [];
  const attemptList = (attempts as QuizAttempt[] | undefined) ?? [];

  const handleGenerate = () => {
    if (!genForm.subject.trim()) return;
    generateQuiz.mutate(
      { subject: genForm.subject, topic: genForm.topic || undefined, difficulty: genForm.difficulty, question_count: genForm.question_count[0] },
      {
        onSuccess: () => {
          setGenOpen(false);
          setGenForm({ subject: "", topic: "", question_count: [5], difficulty: "medium" });
          toast({ title: "Quiz created!", description: `${genForm.question_count[0]} questions on "${genForm.subject}".` });
        },
        onError: () => {
          toast({ title: "Generation failed", description: "Please check your Gemini API key and try again.", variant: "destructive" });
        },
      }
    );
  };

  const handleDeleteConfirm = () => {
    if (!deleteId) return;
    deleteQuiz.mutate(deleteId, {
      onSuccess: () => {
        setDeleteId(null);
        toast({ title: "Quiz deleted" });
      },
    });
  };

  const openEdit = (quiz: Quiz) => {
    setEditQuiz(quiz);
    setEditForm({ title: quiz.title || quiz.subject || "", subject: quiz.subject || "", difficulty: quiz.difficulty || "medium" });
  };

  const handleEdit = () => {
    if (!editQuiz) return;
    updateQuiz.mutate(
      { id: editQuiz.id, title: editForm.title || undefined, subject: editForm.subject || undefined, difficulty: editForm.difficulty },
      {
        onSuccess: () => {
          setEditQuiz(null);
          toast({ title: "Quiz updated!" });
        },
      }
    );
  };

  const startQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setCurrentQ(0);
    setAnswers({});
    setResults(null);
    startTimeRef.current = Date.now();
    setView("taking");
  };

  const selectAnswer = (qIndex: number, answer: string) => {
    setAnswers((prev) => ({ ...prev, [qIndex]: answer }));
  };

  const handleSubmit = () => {
    if (!activeQuiz) return;
    const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);
    const payload = activeQuiz.questions.map((q, i) => ({
      question_index: getQuestionIndex(q, i),
      answer: answers[getQuestionIndex(q, i)] ?? "",
    }));
    submitQuiz.mutate(
      { id: activeQuiz.id, answers: payload, time_taken_seconds: timeTaken },
      {
        onSuccess: (data: QuizAttempt) => { setResults(data); setView("results"); },
        onError: () => { toast({ title: "Submission failed", description: "Please try again.", variant: "destructive" }); },
      }
    );
  };

  const q = activeQuiz?.questions[currentQ];
  const qIndex = q ? getQuestionIndex(q, currentQ) : currentQ;
  const qText = q ? getQuestionText(q) : "";
  const answered = Object.keys(answers).length;
  const total = activeQuiz?.questions.length ?? 0;

  if (view === "taking" && activeQuiz && q) {
    const selectedAnswer = answers[qIndex];
    const qType = q.question_type ?? q.type;
    const options: string[] = q.options ?? [];
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setView("list")} className="gap-1.5"><ArrowLeft className="w-4 h-4" /> Back</Button>
          <span className="text-sm font-medium text-muted-foreground">{currentQ + 1} / {total}</span>
          <Button variant="outline" size="sm" className="gap-1.5 text-destructive border-destructive/30" onClick={() => setView("list")}>Quit</Button>
        </div>
        <div className="space-y-1.5">
          <Progress value={((currentQ + 1) / total) * 100} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{activeQuiz.subject}</span>
            <span>{answered} answered</span>
          </div>
        </div>
        <Card className="border-border shadow-md">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0">{currentQ + 1}</div>
              <CardTitle className="text-lg leading-snug font-medium text-foreground">{qText}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {qType === "true_false" ? (
              ["True", "False"].map((opt) => (
                <button key={opt} onClick={() => selectAnswer(qIndex, opt)} className={cn("w-full text-left p-4 rounded-xl border-2 transition-all font-medium text-sm", selectedAnswer === opt ? "border-primary bg-primary/10 text-primary" : "border-border bg-card hover:border-primary/40 hover:bg-muted/50")}>{opt}</button>
              ))
            ) : options.length > 0 ? (
              options.map((opt, i) => (
                <button key={i} onClick={() => selectAnswer(qIndex, opt)} className={cn("w-full text-left p-4 rounded-xl border-2 transition-all text-sm flex items-start gap-3", selectedAnswer === opt ? "border-primary bg-primary/10 text-primary" : "border-border bg-card hover:border-primary/40 hover:bg-muted/50 text-foreground")}>
                  <span className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0", selectedAnswer === opt ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40")}>{String.fromCharCode(65 + i)}</span>
                  {opt}
                </button>
              ))
            ) : (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Your answer:</Label>
                <Input value={answers[qIndex] ?? ""} onChange={(e) => selectAnswer(qIndex, e.target.value)} placeholder="Type your answer..." className="bg-muted/30" />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between gap-3 pt-0">
            <Button variant="outline" onClick={() => setCurrentQ((p) => Math.max(0, p - 1))} disabled={currentQ === 0} className="gap-1.5"><ArrowLeft className="w-4 h-4" /> Previous</Button>
            {currentQ < total - 1 ? (
              <Button onClick={() => setCurrentQ((p) => p + 1)} className="gap-1.5">Next <ArrowRight className="w-4 h-4" /></Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitQuiz.isPending} className="gap-1.5 bg-green-600 hover:bg-green-700">
                {submitQuiz.isPending ? "Submitting..." : "Submit Quiz"}<CheckCircle2 className="w-4 h-4" />
              </Button>
            )}
          </CardFooter>
        </Card>
        <div className="flex flex-wrap gap-2 justify-center">
          {activeQuiz.questions.map((_, i) => {
            const qi = getQuestionIndex(activeQuiz.questions[i], i);
            return (
              <button key={i} onClick={() => setCurrentQ(i)} className={cn("w-8 h-8 rounded-full text-xs font-semibold border-2 transition-colors", i === currentQ ? "border-primary bg-primary text-primary-foreground" : answers[qi] !== undefined ? "border-green-500 bg-green-500/10 text-green-600" : "border-border bg-card text-muted-foreground hover:border-primary/40")}>{i + 1}</button>
            );
          })}
        </div>
      </div>
    );
  }

  if (view === "results" && activeQuiz && results) {
    const pct = results.percentage ?? 0;
    const passed = pct >= 70;
    const totalQ = results.max_score ?? activeQuiz.questions.length;
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className={cn("border-2 shadow-lg", passed ? "border-green-500/40 bg-green-500/5" : "border-red-500/40 bg-red-500/5")}>
          <CardContent className="pt-8 pb-6 text-center">
            <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-black", passed ? "bg-green-500/20 text-green-600" : "bg-red-500/20 text-red-600")}>{Math.round(pct)}%</div>
            <h2 className={cn("text-2xl font-bold", passed ? "text-green-600" : "text-red-600")}>{passed ? "🎉 Passed!" : "Keep Practicing"}</h2>
            <p className="text-muted-foreground text-sm mt-1">{results.score} / {totalQ} correct on "{activeQuiz.subject}"</p>
            {results.ai_feedback && <p className="text-sm text-muted-foreground mt-3 mx-auto max-w-md italic bg-muted/50 rounded-lg p-3">{results.ai_feedback}</p>}
            <div className="flex gap-3 justify-center mt-4">
              <Button variant="outline" onClick={() => startQuiz(activeQuiz)} className="gap-1.5"><RotateCcw className="w-4 h-4" /> Retry</Button>
              <Button onClick={() => setView("list")} className="gap-1.5"><ArrowLeft className="w-4 h-4" /> All Quizzes</Button>
            </div>
          </CardContent>
        </Card>
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Question Review</h3>
          {activeQuiz.questions.map((q, i) => {
            const qi = getQuestionIndex(q, i);
            const ans = results.answers?.find((a) => a.question_index === qi);
            const correct = ans?.is_correct;
            return (
              <Card key={i} className={cn("border", correct ? "border-green-500/30" : "border-red-500/30")}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {correct ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{i + 1}. {getQuestionText(q)}</p>
                      <div className="mt-2 space-y-1 text-xs">
                        <div className={cn("px-2 py-1 rounded", correct ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-red-500/10 text-red-700 dark:text-red-400")}>Your answer: {ans?.user_answer || "(no answer)"}</div>
                        {!correct && <div className="px-2 py-1 rounded bg-green-500/10 text-green-700 dark:text-green-400">Correct: {ans?.correct_answer ?? q.correct_answer}</div>}
                        {q.explanation && <div className="px-2 py-1 rounded bg-muted text-muted-foreground mt-1 italic">{q.explanation}</div>}
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
        <Button onClick={() => setGenOpen(true)} className="gap-2"><Plus className="w-4 h-4" /> Generate Quiz</Button>
      </div>

      {/* Generate dialog */}
      <Dialog open={genOpen} onOpenChange={setGenOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Generate AI Quiz</DialogTitle></DialogHeader>
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label>Subject <span className="text-destructive">*</span></Label>
              <Input value={genForm.subject} onChange={(e) => setGenForm({ ...genForm, subject: e.target.value })} placeholder="E.g. Biology, World History..." autoFocus />
            </div>
            <div className="space-y-2">
              <Label>Topic <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input value={genForm.topic} onChange={(e) => setGenForm({ ...genForm, topic: e.target.value })} placeholder="E.g. Photosynthesis..." />
            </div>
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={genForm.difficulty} onValueChange={(v) => setGenForm({ ...genForm, difficulty: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Number of questions</Label>
                <span className="text-sm font-bold text-primary">{genForm.question_count[0]}</span>
              </div>
              <Slider min={3} max={20} step={1} value={genForm.question_count} onValueChange={(v) => setGenForm({ ...genForm, question_count: v })} />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setGenOpen(false)}>Cancel</Button>
            <Button onClick={handleGenerate} disabled={generateQuiz.isPending || !genForm.subject.trim()} className="gap-2">
              <BrainCircuit className="w-4 h-4" />{generateQuiz.isPending ? "Generating..." : "Create Quiz"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editQuiz} onOpenChange={(o) => !o && setEditQuiz(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Pencil className="w-4 h-4" /> Edit Quiz</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} placeholder="Quiz title..." />
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input value={editForm.subject} onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })} placeholder="Subject..." />
            </div>
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={editForm.difficulty} onValueChange={(v) => setEditForm({ ...editForm, difficulty: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setEditQuiz(null)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={updateQuiz.isPending}>{updateQuiz.isPending ? "Saving..." : "Save Changes"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quiz?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the quiz and all its attempt history.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {attemptList.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Quizzes Taken", value: attemptList.length },
            { label: "Avg Score", value: `${Math.round(attemptList.reduce((s, a) => s + (a.percentage ?? 0), 0) / attemptList.length)}%` },
            { label: "Passed", value: attemptList.filter((a) => (a.percentage ?? 0) >= 70).length },
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
                    <CardTitle className="text-base line-clamp-2">{quiz.title || quiz.subject}</CardTitle>
                    <div className="flex items-center gap-1 shrink-0">
                      {best !== null && (
                        <Badge variant={best >= 70 ? "default" : "secondary"} className="text-xs">{Math.round(best)}%</Badge>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(quiz)}>
                            <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(quiz.id)}>
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <CardDescription className="flex items-center gap-2 text-xs mt-1">
                    <span>{quiz.question_count ?? quiz.questions?.length} questions</span>
                    {quiz.difficulty && <><span>·</span><span className="capitalize">{quiz.difficulty}</span></>}
                    {quiz.subject && <><span>·</span><span>{quiz.subject}</span></>}
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
                  <Button className="w-full gap-2" onClick={() => startQuiz(quiz)} disabled={!quiz.questions?.length}>
                    <Play className="w-4 h-4 fill-current" />{quizAttempts.length > 0 ? "Retake Quiz" : "Start Quiz"}
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
          <Button className="mt-4 gap-2" onClick={() => setGenOpen(true)}><Plus className="w-4 h-4" /> Generate Quiz</Button>
        </div>
      )}
    </div>
  );
}
