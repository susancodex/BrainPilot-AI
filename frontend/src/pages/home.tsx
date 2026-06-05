import { Link, Redirect } from "wouter";
import { isAuthenticated } from "@/lib/auth";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import {
  BrainCircuit,
  Target,
  MessageSquare,
  BarChart2,
  ArrowRight,
  BookOpen,
  Timer,
} from "lucide-react";

const FEATURES = [
  { icon: MessageSquare, title: "AI Tutor", description: "Clear explanations with automatic provider failover." },
  { icon: Target, title: "Goals & Planner", description: "Weekly plans and sessions you can follow." },
  { icon: BookOpen, title: "Notes & Revision", description: "Summaries, flashcards, and spaced review." },
  { icon: BarChart2, title: "Analytics", description: "Streaks, focus time, and subject balance." },
  { icon: Timer, title: "Focus Sessions", description: "Timers built for consistent study rhythm." },
  { icon: BrainCircuit, title: "Secure access", description: "JWT auth, roles, and structured APIs." },
];

export default function Home() {
  if (isAuthenticated()) {
    return <Redirect to="/dashboard" />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl min-w-0 items-center justify-between gap-2 px-4 py-4 sm:gap-3 sm:px-8">
          <BrandMark subtitle="by Susan Acharya" className="min-w-0 shrink" />
          <nav className="flex shrink-0 items-center gap-2">
            <Button variant="ghost" asChild className="hidden min-h-[44px] sm:inline-flex">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild className="min-h-[44px] px-3 sm:px-4">
              <Link href="/register">
                <span className="sm:hidden">Start</span>
                <span className="hidden sm:inline">Get started</span>
                <ArrowRight className="ml-1 h-4 w-4 sm:ml-2" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-8 sm:py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-primary">Study workspace</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
              Plan, revise, and learn — without switching tools.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
              BrainPilot AI combines planning, revision, quizzes, and tutoring in one professional
              interface. Designed and owned by{" "}
              <span className="font-medium text-foreground">Susan Acharya</span>.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button size="lg" asChild className="min-h-[44px] w-full sm:w-auto">
                <Link href="/register">Create free account</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="min-h-[44px] w-full sm:w-auto">
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-muted/40 py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-8">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">What you get</h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Everything needed for disciplined study — no clutter, no gimmicks.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, description }) => (
                <article
                  key={title}
                  className="rounded-lg border border-border bg-card p-5"
                >
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-medium">{title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 text-center sm:px-8 sm:py-16">
          <h2 className="text-2xl font-semibold tracking-tight">Ready to start?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Create an account in under a minute and open your dashboard.
          </p>
          <Button size="lg" className="mt-6 min-h-[44px] w-full sm:w-auto" asChild>
            <Link href="/register">Get started</Link>
          </Button>
        </section>
      </main>

      <footer className="border-t border-border py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-sm text-muted-foreground sm:flex-row sm:px-8">
          <p>© {new Date().getFullYear()} BrainPilot AI · Susan Acharya</p>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-foreground">Sign in</Link>
            <Link href="/register" className="hover:text-foreground">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
