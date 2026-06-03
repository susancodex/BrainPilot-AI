import { usePlans, useGeneratePlan, useSessions, useUpdateSession, useExtractSyllabus } from "@/hooks/use-planner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef } from "react";
import { Calendar, Clock, BookOpen, Layers, Sparkles, Upload, FileText, X, ClipboardPaste, CheckCircle2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { StudyPlan, StudySession } from "@/types";

type SyllabusMode = "none" | "paste" | "upload";

export default function Planner() {
  const { data: plans, isLoading: plansLoading } = usePlans();
  const { data: sessions, isLoading: sessionsLoading } = useSessions();
  const generatePlan = useGeneratePlan();
  const updateSession = useUpdateSession();
  const extractSyllabus = useExtractSyllabus();
  const { toast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    subjects: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    plan_type: "weekly",
    daily_hours: [2],
  });

  const [syllabusMode, setSyllabusMode] = useState<SyllabusMode>("none");
  const [syllabusText, setSyllabusText] = useState("");
  const [pasteBuffer, setPasteBuffer] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [syllabusReady, setSyllabusReady] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast({ title: "Invalid file", description: "Please upload a PDF file.", variant: "destructive" });
      return;
    }
    setUploadedFile(file);
    setSyllabusReady(false);
    setSyllabusText("");
  };

  const handleExtractPDF = () => {
    if (!uploadedFile) return;
    extractSyllabus.mutate(
      { file: uploadedFile },
      {
        onSuccess: (data) => {
          setSyllabusText(data.text);
          setSyllabusReady(true);
          toast({
            title: "Syllabus extracted",
            description: `${data.pages ?? "?"} page(s) read. AI will use this to structure your plan.`,
          });
        },
        onError: () => {
          toast({ title: "Extraction failed", description: "Try pasting your syllabus as text instead.", variant: "destructive" });
        },
      }
    );
  };

  const handleUsePastedText = () => {
    if (!pasteBuffer.trim()) return;
    setSyllabusText(pasteBuffer.trim());
    setSyllabusReady(true);
    toast({ title: "Syllabus saved", description: "AI will use this to tailor your study plan." });
  };

  const clearSyllabus = () => {
    setSyllabusText("");
    setSyllabusReady(false);
    setUploadedFile(null);
    setPasteBuffer("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGenerate = () => {
    if (!formData.subjects) return;
    generatePlan.mutate(
      {
        subjects: formData.subjects.split(",").map((s) => s.trim()).filter(Boolean),
        start_date: formData.start_date,
        end_date: formData.end_date,
        plan_type: formData.plan_type,
        daily_hours: formData.daily_hours[0],
        syllabus_text: syllabusText || undefined,
      },
      {
        onSuccess: () => {
          toast({ title: "Plan generated!", description: "Your AI study plan is ready." });
        },
        onError: () => {
          toast({ title: "Generation failed", description: "Please try again.", variant: "destructive" });
        },
      }
    );
  };

  const handleStatusChange = (id: string, status: string) => {
    updateSession.mutate({ id, status });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500/10 text-green-500";
      case "in_progress": return "bg-amber-500/10 text-amber-500";
      case "skipped": return "bg-destructive/10 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const planList = (plans as StudyPlan[] | undefined) ?? [];
  const sessionList = (sessions as StudySession[] | undefined) ?? [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">AI Study Planner</h1>
          <p className="text-muted-foreground mt-1">Let AI create your optimal learning schedule.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── Generate Plan card ── */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-border shadow-md border-primary/20 bg-card overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-primary to-accent" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Generate Plan
              </CardTitle>
              <CardDescription>Tell the AI what you need to study.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* Subjects */}
              <div className="space-y-2">
                <Label>Subjects (comma separated)</Label>
                <Input
                  placeholder="e.g. Biology, Chemistry"
                  value={formData.subjects}
                  onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} />
                </div>
              </div>

              {/* Plan type */}
              <div className="space-y-2">
                <Label>Plan Type</Label>
                <Select value={formData.plan_type} onValueChange={(v) => setFormData({ ...formData, plan_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily Intensive</SelectItem>
                    <SelectItem value="weekly">Weekly Routine</SelectItem>
                    <SelectItem value="monthly">Monthly Marathon</SelectItem>
                    <SelectItem value="emergency">Emergency Cram</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Daily hours */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Daily Hours</Label>
                  <span className="font-bold text-primary">{formData.daily_hours[0]}h</span>
                </div>
                <Slider min={0.5} max={16} step={0.5} value={formData.daily_hours} onValueChange={(v) => setFormData({ ...formData, daily_hours: v })} />
              </div>

              {/* ── Syllabus section ── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-primary" />
                    Syllabus <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  {syllabusReady && (
                    <button onClick={clearSyllabus} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1">
                      <X className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>

                {/* Syllabus ready banner */}
                {syllabusReady ? (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-green-600 dark:text-green-400">Syllabus loaded</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{syllabusText.slice(0, 120)}…</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Mode toggle */}
                    {syllabusMode === "none" && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setSyllabusMode("paste")}
                          className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors text-sm text-muted-foreground"
                        >
                          <ClipboardPaste className="w-5 h-5 text-primary" />
                          Paste syllabus
                        </button>
                        <button
                          onClick={() => setSyllabusMode("upload")}
                          className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors text-sm text-muted-foreground"
                        >
                          <Upload className="w-5 h-5 text-primary" />
                          Upload PDF
                        </button>
                      </div>
                    )}

                    {/* Paste mode */}
                    {syllabusMode === "paste" && (
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Paste your course syllabus or topic list here…"
                          value={pasteBuffer}
                          onChange={(e) => setPasteBuffer(e.target.value)}
                          rows={5}
                          className="resize-none text-sm"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => { setSyllabusMode("none"); setPasteBuffer(""); }}>
                            Cancel
                          </Button>
                          <Button size="sm" className="flex-1 text-xs" onClick={handleUsePastedText} disabled={!pasteBuffer.trim()}>
                            Use This Syllabus
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Upload mode */}
                    {syllabusMode === "upload" && (
                      <div className="space-y-2">
                        <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
                        {!uploadedFile ? (
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full flex flex-col items-center gap-2 p-5 rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors"
                          >
                            <FileText className="w-8 h-8 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Click to select a PDF</span>
                            <span className="text-xs text-muted-foreground/70">Syllabus, course outline, or topic list</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/60 border border-border">
                            <FileText className="w-5 h-5 text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{uploadedFile.name}</p>
                              <p className="text-xs text-muted-foreground">{(uploadedFile.size / 1024).toFixed(0)} KB</p>
                            </div>
                            <button onClick={() => { setUploadedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="text-muted-foreground hover:text-destructive">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => { setSyllabusMode("none"); setUploadedFile(null); }}>
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 text-xs"
                            onClick={handleExtractPDF}
                            disabled={!uploadedFile || extractSyllabus.isPending}
                          >
                            {extractSyllabus.isPending ? "Reading PDF…" : "Extract & Use"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-2">
              {syllabusReady && (
                <div className="w-full flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  AI will use your syllabus to structure each session topic
                </div>
              )}
              <Button
                className="w-full gap-2"
                onClick={handleGenerate}
                disabled={generatePlan.isPending || !formData.subjects}
              >
                <Sparkles className="w-4 h-4" />
                {generatePlan.isPending ? "AI is thinking…" : "Generate AI Plan"}
              </Button>
            </CardFooter>
          </Card>

          {/* Plans list */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Your Plans</h2>
            {plansLoading ? (
              <div className="text-muted-foreground text-sm">Loading…</div>
            ) : planList.length ? (
              planList.map((plan) => (
                <Card key={plan.id} className="border-border shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Layers className="w-5 h-5 text-primary" />
                      {plan.title || "Study Plan"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="flex gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {plan.duration_days ?? "—"} Days</span>
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {plan.daily_hours}h/day</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="bg-muted px-2 py-1 rounded">
                        Type: <span className="font-semibold text-foreground uppercase">{plan.plan_type}</span>
                      </span>
                      <span className="text-primary font-medium">
                        {plan.completed_sessions ?? 0}/{plan.session_count ?? 0} Sessions
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-muted-foreground p-4 bg-muted/50 rounded-lg text-center text-sm">
                No plans generated yet.
              </div>
            )}
          </div>
        </div>

        {/* ── Sessions ── */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-xl font-semibold">Study Sessions</h2>
          {sessionsLoading ? (
            <div className="text-muted-foreground text-sm">Loading sessions…</div>
          ) : sessionList.length ? (
            <div className="space-y-3">
              {sessionList.map((session) => (
                <Card key={session.id} className="border-border shadow-sm overflow-hidden flex flex-row">
                  <div className="w-2 bg-primary" />
                  <div className="p-4 flex-1 flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${getStatusColor(session.status)}`}>
                          {session.status.replace("_", " ")}
                        </span>
                        <span className="text-xs font-medium text-muted-foreground">{session.subject}</span>
                      </div>
                      <div className="font-semibold text-foreground">{session.topic}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(session.scheduled_date).toLocaleDateString()}
                        <span className="mx-1">·</span>
                        <Clock className="w-3.5 h-3.5" />
                        {session.start_time} – {session.end_time}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <Select value={session.status} onValueChange={(v) => handleStatusChange(session.id, v)}>
                        <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="skipped">Skipped</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center p-12 border border-dashed rounded-xl text-muted-foreground bg-card">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-muted" />
              <p className="text-lg font-medium text-foreground">Empty Calendar</p>
              <p className="text-sm">Generate a plan to populate your study sessions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
