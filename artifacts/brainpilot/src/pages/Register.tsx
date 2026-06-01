import { Link, useLocation } from "wouter";
import { GraduationCap, ArrowRight, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const [, setLocation] = useLocation();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocation("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-card border-r border-border flex-col justify-between p-10">
        <Link href="/">
          <span className="flex items-center gap-2 cursor-pointer">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
              <GraduationCap className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-bold text-foreground">BrainPilot AI</span>
          </span>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-3">Your study system, finally sorted</h2>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            Everything a serious student needs — in one beautifully designed platform.
          </p>
          <div className="space-y-3">
            {[
              "AI study assistant available 24/7",
              "Spaced repetition flashcard system",
              "AI-generated quizzes from your notes",
              "Smart planner and goal tracking",
              "PDF learning with annotations",
              "Progress analytics and insights",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5 text-sm text-foreground">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>
        <p className="text-muted-foreground text-xs">Free plan includes all core features. No credit card required.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <Link href="/" className="lg:hidden">
              <span className="flex items-center gap-2 cursor-pointer mb-6">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary">
                  <GraduationCap className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-sm">BrainPilot AI</span>
              </span>
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
            <p className="text-muted-foreground text-sm mt-1">Start studying smarter today — it's free</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="first-name">First name</label>
                <input
                  id="first-name"
                  type="text"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Alex"
                  data-testid="input-first-name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="last-name">Last name</label>
                <input
                  id="last-name"
                  type="text"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Johnson"
                  data-testid="input-last-name"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="reg-email">Email address</label>
              <input
                id="reg-email"
                type="email"
                required
                className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="you@university.edu"
                data-testid="input-email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="reg-password">Password</label>
              <input
                id="reg-password"
                type="password"
                required
                minLength={8}
                className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Min. 8 characters"
                data-testid="input-password"
              />
            </div>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all"
              data-testid="button-submit"
            >
              Create free account <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center text-[11px] text-muted-foreground mt-4">
            By creating an account you agree to our Terms of Service and Privacy Policy.
          </p>
          <p className="text-center text-sm text-muted-foreground mt-3">
            Already have an account?{" "}
            <Link href="/login">
              <span className="text-primary font-medium hover:underline cursor-pointer">Sign in</span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
