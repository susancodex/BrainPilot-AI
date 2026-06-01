import { useState } from "react";
import { Link } from "wouter";
import { useListQuizzes, useCreateQuiz, useDeleteQuiz, getListQuizzesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Brain, Plus, Trash2, ChevronRight, Star, Clock } from "lucide-react";

export default function QuizzesPage() {
  const qc = useQueryClient();
  const { data: quizzes, isLoading } = useListQuizzes();
  const createQuiz = useCreateQuiz();
  const deleteQuiz = useDeleteQuiz();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", subject: "", description: "", timeLimitMinutes: "" });
  const [questions, setQuestions] = useState([{ question: "", options: ["", "", "", ""], correctIndex: 0, explanation: "" }]);

  function addQuestion() {
    setQuestions(q => [...q, { question: "", options: ["", "", "", ""], correctIndex: 0, explanation: "" }]);
  }

  function updateQuestion(i: number, field: string, value: string | number) {
    setQuestions(q => q.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  }

  function updateOption(qi: number, oi: number, value: string) {
    setQuestions(q => q.map((item, idx) => idx === qi ? { ...item, options: item.options.map((o, j) => j === oi ? value : o) } : item));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.subject.trim() || questions.length === 0) return;
    const validQ = questions.filter(q => q.question.trim() && q.options.every(o => o.trim()));
    if (validQ.length === 0) return;
    createQuiz.mutate(
      { data: { title: form.title, subject: form.subject, description: form.description, timeLimitMinutes: form.timeLimitMinutes ? Number(form.timeLimitMinutes) : undefined, questions: validQ } },
      { onSuccess: () => { qc.invalidateQueries({ queryKey: getListQuizzesQueryKey() }); setShowForm(false); setForm({ title: "", subject: "", description: "", timeLimitMinutes: "" }); setQuestions([{ question: "", options: ["", "", "", ""], correctIndex: 0, explanation: "" }]); } }
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quizzes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{(quizzes ?? []).length} quizzes</p>
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity" data-testid="button-new-quiz">
          <Plus className="w-4 h-4" /> New quiz
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-5 border border-border rounded-xl bg-card max-h-[70vh] overflow-y-auto">
          <h3 className="font-semibold text-foreground mb-4">Create quiz</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Cell Biology Quiz" data-testid="input-quiz-title" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Subject *</label>
                <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Biology" data-testid="input-quiz-subject" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Time limit (minutes)</label>
                <input type="number" min={1} value={form.timeLimitMinutes} onChange={e => setForm(f => ({ ...f, timeLimitMinutes: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Optional" data-testid="input-quiz-time" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Questions</p>
                <button type="button" onClick={addQuestion} className="text-xs text-primary hover:underline">+ Add question</button>
              </div>
              {questions.map((q, qi) => (
                <div key={qi} className="p-4 border border-border rounded-xl space-y-3 bg-background">
                  <p className="text-xs font-semibold text-muted-foreground">Question {qi + 1}</p>
                  <input value={q.question} onChange={e => updateQuestion(qi, "question", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Question text..." data-testid={`input-q-${qi}`} />
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input type="radio" name={`correct-${qi}`} checked={q.correctIndex === oi} onChange={() => updateQuestion(qi, "correctIndex", oi)} className="text-primary" />
                        <input value={opt} onChange={e => updateOption(qi, oi, e.target.value)} className="flex-1 px-3 py-1.5 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder={`Option ${oi + 1}`} data-testid={`input-opt-${qi}-${oi}`} />
                        {q.correctIndex === oi && <span className="text-[10px] text-emerald-600 font-semibold">correct</span>}
                      </div>
                    ))}
                  </div>
                  <input value={q.explanation} onChange={e => updateQuestion(qi, "explanation", e.target.value)} className="w-full px-3 py-1.5 rounded-lg border border-input bg-card text-xs focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Explanation (optional)" data-testid={`input-explanation-${qi}`} />
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button type="submit" disabled={createQuiz.isPending} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50" data-testid="button-create-quiz">
                {createQuiz.isPending ? "Creating..." : "Create quiz"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-muted">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-36 rounded-xl animate-pulse bg-muted" />)}</div>
      ) : (quizzes ?? []).length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Brain className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No quizzes yet</p>
          <p className="text-sm mt-1">Create your first quiz to test your knowledge</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {(quizzes ?? []).map(quiz => (
            <div key={quiz.id} className="group bg-card border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-md transition-all" data-testid={`quiz-${quiz.id}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{quiz.title}</p>
                  <p className="text-xs text-muted-foreground">{quiz.subject}</p>
                </div>
                <button onClick={() => deleteQuiz.mutate({ id: quiz.id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getListQuizzesQueryKey() }) })} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all" data-testid={`delete-quiz-${quiz.id}`}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs text-muted-foreground">{quiz.questionCount} questions</span>
                {quiz.timeLimitMinutes && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="w-3 h-3" />{quiz.timeLimitMinutes}m</div>}
                {quiz.attemptCount > 0 && <span className="text-xs text-muted-foreground">{quiz.attemptCount} attempts</span>}
              </div>

              {quiz.bestScore !== null && quiz.bestScore !== undefined && (
                <div className="flex items-center gap-1.5 mb-3">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                  <span className="text-sm font-semibold text-foreground">Best: {Math.round(quiz.bestScore)}%</span>
                </div>
              )}

              <Link href={`/quizzes/${quiz.id}`}>
                <span className="flex items-center justify-between text-xs font-medium text-primary hover:underline cursor-pointer">
                  Take quiz <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
