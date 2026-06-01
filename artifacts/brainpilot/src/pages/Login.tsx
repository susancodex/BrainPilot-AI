import { Link, useLocation } from "wouter";
import { GraduationCap, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [, setLocation] = useLocation();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocation("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-primary flex-col justify-between p-10">
        <Link href="/">
          <span className="flex items-center gap-2 cursor-pointer">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/20">
              <GraduationCap className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-bold text-white">BrainPilot AI</span>
          </span>
        </Link>
        <div>
          <blockquote className="text-white/90 text-2xl font-light leading-snug mb-5">
            "The app that turned my chaotic study habits into a structured system. My grades went from average to top of class in one semester."
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold text-white">JK</div>
            <div>
              <p className="text-white text-sm font-medium">James Kim</p>
              <p className="text-white/60 text-xs">Law student, Harvard</p>
            </div>
          </div>
        </div>
        <p className="text-white/50 text-xs">Trusted by 2.4 million students worldwide</p>
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
            <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
            <p className="text-muted-foreground text-sm mt-1">Sign in to continue your study session</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                type="email"
                required
                defaultValue="student@example.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                placeholder="you@university.edu"
                data-testid="input-email"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="login-password">Password</label>
                <a href="#" className="text-xs text-primary hover:underline">Forgot password?</a>
              </div>
              <input
                id="login-password"
                type="password"
                required
                defaultValue="password"
                className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                placeholder="••••••••"
                data-testid="input-password"
              />
            </div>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all"
              data-testid="button-submit"
            >
              Sign in <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-5">
            Don't have an account?{" "}
            <Link href="/register">
              <span className="text-primary font-medium hover:underline cursor-pointer">Create one free</span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
