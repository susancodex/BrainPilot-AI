import { Link, Redirect } from "wouter";
import { isAuthenticated } from "@/lib/auth";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Target,
  BookOpen,
  BarChart2,
  Timer,
  FileText,
  Zap,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: MessageSquare,
    label: "AI Tutor",
    description:
      "Ask any study question and get structured explanations. Falls back across providers automatically — always available.",
  },
  {
    icon: Target,
    label: "Goals & Planner",
    description:
      "Set weekly learning goals, break them into sessions, and track completion in one unified view.",
  },
  {
    icon: BookOpen,
    label: "Notes & Flashcards",
    description:
      "Rich-text notes with AI-generated summaries. Build flashcard decks and review with spaced repetition.",
  },
  {
    icon: BarChart2,
    label: "Progress Analytics",
    description:
      "Streaks, focus time, subject breakdown, and session history. Know exactly where your time goes.",
  },
  {
    icon: Timer,
    label: "Focus Sessions",
    description:
      "Structured Pomodoro-style timers tied to subjects. Build a consistent study rhythm over time.",
  },
  {
    icon: FileText,
    label: "PDF Workspace",
    description:
      "Upload lecture notes and textbooks. Organise, annotate metadata, and retrieve them by subject.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Create your account",
    body: "Register in under a minute. No credit card required. Your workspace is ready immediately.",
  },
  {
    number: "02",
    title: "Set up your subjects",
    body: "Add your courses, create goals, and upload any PDFs or notes you already have.",
  },
  {
    number: "03",
    title: "Study with AI support",
    body: "Use the AI tutor, run focus sessions, take quizzes, and watch your analytics grow.",
  },
];

const HIGHLIGHTS = [
  "7 tools in one workspace",
  "AI tutor always available",
  "Free to get started",
  "No ads, no distractions",
];

export default function Home() {
  if (isAuthenticated()) {
    return <Redirect to="/dashboard" />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground antialiased overflow-x-hidden">

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4 sm:px-8">
          <BrandMark />
          <nav className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">
                Get started
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>

        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-20 sm:px-8 sm:pb-32 sm:pt-28">
            <h1 className="max-w-[800px] text-4xl font-semibold leading-tight tracking-tight sm:text-5xl md:text-6xl">
              Everything you need{" "}
              <span className="text-primary">to study smarter</span>,
              in one place.
            </h1>

            <p className="mt-6 max-w-[580px] text-lg leading-relaxed text-muted-foreground sm:text-xl">
              BrainPilot AI brings together planning, revision, quizzes,
              flashcards, and an AI tutor into a single focused workspace —
              built for serious learners.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:gap-3">
              <Button size="lg" asChild className="h-12 gap-2 text-base">
                <Link href="/register">
                  Create free account
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-12 text-base">
                <Link href="/login">Sign in to your workspace</Link>
              </Button>
            </div>

            {/* Highlight chips */}
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
              {HIGHLIGHTS.map((h) => (
                <li key={h} className="flex items-center gap-2 text-base text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                  {h}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Stats bar ───────────────────────────────────────────────────── */}
        <section className="border-b border-border bg-muted/50">
          <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-border sm:grid-cols-4 px-6 sm:px-8">
            {[
              { value: "7", label: "Integrated tools" },
              { value: "3×", label: "AI provider failover" },
              { value: "100%", label: "Owned by you" },
              { value: "Free", label: "To start" },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center gap-1 px-6 py-8 text-center first:pl-0 last:pr-0 sm:px-10">
                <span className="text-3xl font-semibold tracking-tight text-foreground">{value}</span>
                <span className="text-sm text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ────────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-6 py-20 sm:px-8 sm:py-28">
          <div className="mb-16">
            <p className="mb-3 text-sm font-semibold text-primary uppercase tracking-wider">What's included</p>
            <h2 className="max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
              Every tool a focused student needs
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
              No scattered tabs, no switching apps. Every feature is purpose-built
              and connected to your study data.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, label, description }) => (
              <article
                key={label}
                className="group rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:shadow-lg hover:border-primary/30"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{label}</h3>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground">{description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ── How it works ────────────────────────────────────────────────── */}
        <section className="border-y border-border bg-muted/50">
          <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8 sm:py-28">
            <div className="mb-16">
              <p className="mb-3 text-sm font-semibold text-primary uppercase tracking-wider">How it works</p>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Up and running in minutes
              </h2>
            </div>

            <div className="grid gap-8 sm:grid-cols-3">
              {STEPS.map(({ number, title, body }, i) => (
                <div key={number} className="relative flex flex-col">
                  {i < STEPS.length - 1 && (
                    <div
                      aria-hidden
                      className="absolute left-[3.5rem] top-6 hidden h-px w-[calc(100%+2rem)] border-t border-dashed border-border sm:block"
                    />
                  )}
                  <div className="mb-4 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-sm font-semibold text-foreground">
                    {number}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                  <p className="mt-2 text-base leading-relaxed text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Trust bar ───────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-6 py-16 sm:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 sm:gap-x-20">
            {[
              { icon: ShieldCheck, text: "JWT auth & role-based access" },
              { icon: Zap,         text: "AI failover across 3 providers" },
              { icon: BarChart2,   text: "Full session analytics" },
              { icon: CheckCircle2,text: "All data owned by you" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-base text-muted-foreground">
                <Icon className="h-5 w-5 shrink-0 text-primary" />
                {text}
              </div>
            ))}
          </div>
        </section>

        {/* ── Final CTA ───────────────────────────────────────────────────── */}
        <section className="border-t border-border bg-primary/5">
          <div className="mx-auto max-w-6xl px-6 py-20 text-center sm:px-8 sm:py-28">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Start your study workspace today
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
              Free to start. No setup friction. Your dashboard is ready the moment you sign up.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild className="h-12 w-full gap-2 text-base sm:w-auto">
                <Link href="/register">
                  Create free account
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-12 w-full text-base sm:w-auto">
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/60 bg-background">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-6 text-sm text-muted-foreground sm:flex-row sm:px-8">
          <div className="flex items-center gap-2.5">
            <BrandMark compact />
            <span className="text-border/80">·</span>
            <span>© {new Date().getFullYear()} Susan Acharya</span>
          </div>
          <nav className="flex gap-5">
            <Link href="/login"    className="transition-colors hover:text-foreground">Sign in</Link>
            <Link href="/register" className="transition-colors hover:text-foreground">Register</Link>
          </nav>
        </div>
      </footer>

    </div>
  );
}
