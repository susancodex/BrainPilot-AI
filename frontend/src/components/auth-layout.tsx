import { Link } from "wouter";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/brand-mark";

interface AuthLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}

const BULLETS = [
  "Plan sessions and track goals in one place",
  "Revision, quizzes, and notes connected to your progress",
  "AI tutor with reliable provider failover",
];

export function AuthLayout({ title, description, children, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-4 sm:px-8">
          <Link href="/">
            <BrandMark subtitle="Study workspace" />
          </Link>
          <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Home
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:gap-16 lg:py-24">
        <section className="hidden lg:flex flex-col justify-center space-y-8">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground xl:text-5xl">
              Focused tools for serious study habits.
            </h1>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-muted-foreground">
              BrainPilot keeps planning, revision, and AI support in a single calm workspace — built by Susan Acharya.
            </p>
          </div>
          <ul className="space-y-4">
            {BULLETS.map((item) => (
              <li key={item} className="flex gap-3 text-base text-foreground">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto w-full max-w-md lg:max-w-none">
          <div className="rounded-lg border border-border bg-card p-4 sm:p-6 md:p-8">
            <div className="mb-6 lg:hidden">
              <BrandMark compact subtitle="Study workspace" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">{description}</p>
            <div className="mt-6 sm:mt-8">{children}</div>
            <div className="mt-4 text-center text-sm sm:mt-6 sm:text-base">{footer}</div>
          </div>
        </section>
      </div>
    </div>
  );
}
