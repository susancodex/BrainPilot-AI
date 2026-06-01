import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useGetQuiz, useSubmitQuiz, getGetQuizQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { ArrowLeft, Clock, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Trophy } from "lucide-react";

export default function QuizPage({ id }: { id: number }) {
  const qc = useQueryClient();
  const { data: quiz, isLoading } = useGetQuiz(id, { query: { enabled: !!id, queryKey: getGetQuizQueryKey(id) } });
  const submitQuiz = useSubmitQuiz();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; correctCount: number; totalCount: number; passed: boolean; feedback: { questionId: number; correct: boolean; selectedIndex: number; correctIndex: number; explanation?: string | null }[] } | null>(null);
  const [startTime] = useState(Date.now());
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!quiz?.timeLimitMinutes) return;
    setTimeLeft(quiz.timeLimitMinutes * 60);
    const t = setInterval(() => {
      setTimeLeft(s => {
        if (s === null || s <= 0) { clearInterval(t); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [quiz?.timeLimitMinutes]);

  if (isLoading) return <div className="p-6 animate-pulse"><div className="h-64 bg-muted rounded-xl" /></div>;
  if (!quiz) return <div className="p-6 text-muted-foreground">Quiz not found.</div>;

  const questions = quiz.questions ?? [];
  const q = questions[currentQ];
  const answered = Object.keys(answers).length;

  function handleSubmit() {
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    const answerList = questions.map((_, i) => answers[i] ?? -1);
    submitQuiz.mutate(
      { id, data: { answers: answerList, timeTakenSeconds: timeTaken } },
      {
        onSuccess: (res) => {
          setResult({ ...res, feedback: res.feedback ?? [] });
          setSubmitted(true);
          qc.invalidateQueries({ queryKey: getGetQuizQueryKey(id) });
        },
      }
    );
  }

  if (submitted && result) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="text-center py-10 border border-border rounded-2xl bg-card">
          <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4", result.passed ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-rose-100 dark:bg-rose-900/30")}>
            {result.passed ? <Trophy className="w-8 h-8 text-emerald-600 dark:text-emerald-400" /> : <XCircle className="w-8 h-8 text-rose-600 dark:text-rose-400" />}
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-1">{Math.round(result.score)}%</h2>
          <p className="text-muted-foreground mb-1">{result.correctCount} of {result.totalCount} correct</p>
          <p className={cn("text-sm font-semibold mb-8", result.passed ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
            {result.passed ? "Passed" : "Not quite — review and try again"}
          </p>

          <div className="space-y-3 px-6 text-left">
            {result.feedback.map((fb, i) => {
              const question = questions.find(q => q.id === fb.questionId);
              if (!question) return null;
              return (
                <div key={fb.questionId} className={cn("p-4 rounded-xl border", fb.correct ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10 dark:border-emerald-800" : "border-rose-200 bg-rose-50 dark:bg-rose-900/10 dark:border-rose-800")}>
                  <div className="flex items-start gap-2">
                    {fb.correct ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" /> : <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />}
                    <div>
                      <p className="text-sm font-medium text-foreground">{question.question}</p>
                      {!fb.correct && <p className="text-xs text-muted-foreground mt-1">Correct: {question.options[fb.correctIndex]}</p>}
                      {fb.explanation && <p className="text-xs text-muted-foreground mt-1 italic">{fb.explanation}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-3 mt-8">
            <Link href="/quizzes">
              <span className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors cursor-pointer">Back to quizzes</span>
            </Link>
            <button onClick={() => { setAnswers({}); setCurrentQ(0); setSubmitted(false); setResult(null); }} className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">Retry</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/quizzes">
          <span className="p-1.5 rounded-md hover:bg-muted transition-colors cursor-pointer">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </span>
        </Link>
        <div className="flex-1">
          <h1 className="font-bold text-foreground">{quiz.title}</h1>
          <p className="text-xs text-muted-foreground">{quiz.subject} · {questions.length} questions</p>
        </div>
        {timeLeft !== null && (
          <div className={cn("flex items-center gap-1.5 text-sm font-semibold", timeLeft < 60 ? "text-rose-500" : "text-foreground")}>
            <Clock className="w-4 h-4" />
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">Question {currentQ + 1} of {questions.length}</span>
          <span className="text-xs text-muted-foreground">{answered} answered</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
        </div>
        {/* Question dots */}
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {questions.map((_, i) => (
            <button key={i} onClick={() => setCurrentQ(i)} className={cn("w-6 h-6 rounded-full text-[10px] font-semibold transition-all", i === currentQ ? "bg-primary text-white" : answers[i] !== undefined ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground hover:bg-muted-foreground/20")}>
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Question */}
      {q && (
        <div className="bg-card border border-border rounded-2xl p-6 mb-5">
          <p className="text-base font-semibold text-foreground mb-5">{q.question}</p>
          <div className="space-y-2.5">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => setAnswers(a => ({ ...a, [currentQ]: i }))}
                className={cn("w-full text-left px-4 py-3 rounded-xl border text-sm transition-all",
                  answers[currentQ] === i
                    ? "border-primary bg-primary/5 text-foreground font-medium"
                    : "border-border text-foreground hover:border-primary/40 hover:bg-muted/50"
                )}
                data-testid={`option-${i}`}
              >
                <span className={cn("inline-flex items-center justify-center w-5 h-5 rounded-full border text-[10px] font-bold mr-3", answers[currentQ] === i ? "border-primary bg-primary text-white" : "border-muted-foreground text-muted-foreground")}>
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => setCurrentQ(i => Math.max(0, i - 1))} disabled={currentQ === 0} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-muted disabled:opacity-40 transition-all" data-testid="button-prev-q">
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>

        {currentQ < questions.length - 1 ? (
          <button onClick={() => setCurrentQ(i => i + 1)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-muted transition-all" data-testid="button-next-q">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={submitQuiz.isPending} className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all" data-testid="button-submit-quiz">
            {submitQuiz.isPending ? "Submitting..." : `Submit (${answered}/${questions.length} answered)`}
          </button>
        )}
      </div>
    </div>
  );
}
