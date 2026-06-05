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
    <div className="min-h-screen bg-muted/30 overflow-x-hidden">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-8">
          <Link href="/">
            <BrandMark subtitle="Study workspace" />
          </Link>
          <Link href="/" className="inline-flex min-h-[44px] items-center text-sm text-muted-foreground hover:text-foreground">
            Home
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:gap-8 sm:px-8 sm:py-10 lg:grid-cols-2 lg:gap-12 lg:py-14">
        <section className="hidden lg:flex flex-col justify-center">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground xl:text-4xl">
            Focused tools for serious study habits.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
            BrainPilot keeps planning, revision, and AI support in a single calm workspace — built by Susan Acharya.
          </p>
          <ul className="mt-8 space-y-3">
            {BULLETS.map((item) => (
              <li key={item} className="flex gap-2 text-sm text-foreground/90">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto w-full max-w-md lg:max-w-none">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-8">
            <div className="mb-6 lg:hidden">
              <BrandMark compact subtitle="Study workspace" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            <div className="mt-8">{children}</div>
            <div className="mt-6 text-center text-sm">{footer}</div>
          </div>
        </section>
      </div>
    </div>
  );
}
