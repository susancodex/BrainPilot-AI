import { Link } from "wouter";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  Brain, BookOpen, Target, Zap, BarChart3, FileText,
  ChevronRight, Star, CheckCircle2, ArrowRight, Sparkles,
  RotateCcw, Calendar, MessageSquare, GraduationCap, Users,
  TrendingUp, Shield, Clock, Award
} from "lucide-react";

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      className={cn("transition-all duration-700", inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6", className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

const FEATURES = [
  { icon: MessageSquare, title: "AI Study Assistant", desc: "Ask questions, get explanations, explore concepts — powered by GPT-level intelligence that understands context and builds on your knowledge.", color: "bg-blue-500" },
  { icon: Brain, title: "AI Quiz Generator", desc: "Generate custom quizzes on any topic instantly. Multiple choice, true/false — with detailed explanations and performance analytics.", color: "bg-violet-500" },
  { icon: RotateCcw, title: "Spaced Repetition", desc: "Science-backed revision scheduling ensures you review topics at precisely the right intervals for maximum memory retention.", color: "bg-emerald-500" },
  { icon: BookOpen, title: "Flashcard Engine", desc: "Create beautiful flashcard decks with difficulty tracking. Our algorithm surfaces cards you struggle with, not ones you already know.", color: "bg-amber-500" },
  { icon: Calendar, title: "Smart Study Planner", desc: "Plan your study schedule with priority-based task management. Never miss a deadline or revision session again.", color: "bg-rose-500" },
  { icon: FileText, title: "PDF Learning", desc: "Upload lecture notes and textbooks. Highlight, annotate, and ask your AI tutor questions directly about the content.", color: "bg-cyan-500" },
];

const STATS = [
  { value: "2.4M+", label: "Students worldwide" },
  { value: "94%", label: "Improved exam scores" },
  { value: "3.2x", label: "Faster learning" },
  { value: "4.9★", label: "Average rating" },
];

const TESTIMONIALS = [
  { name: "Aisha Patel", role: "Medical Student, UCL", text: "BrainPilot transformed how I study anatomy. The spaced repetition alone helped me retain 40% more information before my finals.", avatar: "AP" },
  { name: "Marcus Chen", role: "CS Undergraduate, MIT", text: "I use the AI chat daily to debug my understanding of algorithms. It's like having a TA available 24/7 who never gets tired of my questions.", avatar: "MC" },
  { name: "Sophie Laurent", role: "Bar Exam Candidate", text: "The quiz generator created 500+ practice questions from my notes. I passed on my first attempt. This app is genuinely game-changing.", avatar: "SL" },
];

const PRICING = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "Perfect for getting started",
    features: ["5 AI chats/day", "3 flashcard decks", "2 quizzes/month", "Basic planner"],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$12",
    period: "per month",
    desc: "For serious students",
    features: ["Unlimited AI chats", "Unlimited flashcard decks", "Unlimited quizzes", "Advanced planner", "PDF learning", "Spaced repetition", "Analytics dashboard"],
    cta: "Start 14-day trial",
    highlight: true,
  },
  {
    name: "Team",
    price: "$8",
    period: "per user/month",
    desc: "For study groups and institutions",
    features: ["Everything in Pro", "Team collaboration", "Admin dashboard", "Progress reporting", "Priority support", "Custom branding"],
    cta: "Contact sales",
    highlight: false,
  },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const FAQS = [
    { q: "How does the AI study assistant work?", a: "BrainPilot uses large language models trained on academic content to answer questions, explain concepts, and guide your learning. It maintains context throughout your conversation, so it builds on what you've already discussed." },
    { q: "Is my study data private?", a: "Yes. Your notes, flashcards, and conversations are encrypted and never used to train our models. You own your data and can export or delete it at any time." },
    { q: "Can I import my existing notes and PDFs?", a: "Absolutely. BrainPilot supports PDF upload directly. You can then highlight, annotate, and ask the AI tutor questions about specific sections of your documents." },
    { q: "Does spaced repetition actually work?", a: "Yes — it's one of the most well-evidenced techniques in cognitive psychology. Our algorithm adapts to your individual performance, scheduling reviews at the optimal interval to prevent forgetting." },
    { q: "Can I use BrainPilot offline?", a: "Your flashcards and planner work offline. AI features require an internet connection, as they communicate with our language model servers." },
  ];

  return (
    <div className="bg-background text-foreground min-h-screen overflow-x-hidden">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
          <Link href="/">
            <span className="flex items-center gap-2 cursor-pointer">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-sm tracking-tight">BrainPilot<span className="text-primary"> AI</span></span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Sign in</span>
            </Link>
            <Link href="/register">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer">
                Get started <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-24 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute top-20 right-0 w-72 h-72 rounded-full bg-accent/5 blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            Powered by advanced AI
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
            Study smarter.
            <br />
            <span className="text-primary">Learn faster.</span>
            <br />
            Score higher.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            BrainPilot AI combines an intelligent study assistant, spaced repetition, adaptive quizzes, and a smart planner — everything you need to go from overwhelmed to on top of it.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register">
              <span className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all hover:shadow-lg hover:shadow-primary/25 cursor-pointer text-sm">
                Start studying for free
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
            <Link href="/login">
              <span className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border text-foreground font-medium hover:bg-secondary transition-colors cursor-pointer text-sm">
                Sign in
              </span>
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">No credit card required. Free forever plan available.</p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border/50 bg-card/50">
        <div className="max-w-4xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <FadeIn key={s.value} delay={i * 80} className="text-center">
              <div className="text-3xl font-bold text-foreground mb-1">{s.value}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Everything you need</p>
            <h2 className="text-4xl font-bold tracking-tight">Your complete study toolkit</h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Six powerful tools in one platform, each designed around how the brain actually learns.
            </p>
          </FadeIn>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <FadeIn key={f.title} delay={i * 60}>
                <div className="p-6 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all group cursor-default">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-transform group-hover:scale-110", f.color)}>
                    <f.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Why BrainPilot */}
      <section className="py-20 px-6 bg-card/40 border-y border-border/50">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-14">
            <h2 className="text-4xl font-bold tracking-tight">Built around how you actually learn</h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Every feature is grounded in cognitive science. Not just another AI wrapper.
            </p>
          </FadeIn>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              { icon: TrendingUp, title: "Adaptive difficulty", desc: "Your study materials adapt to your performance in real time. The system pushes you exactly at the right level." },
              { icon: Clock, title: "Optimal review timing", desc: "Spaced repetition calculates exactly when you should review each topic to maximize retention with minimal time investment." },
              { icon: Shield, title: "Progress you can trust", desc: "Detailed analytics show real mastery, not just activity. Know exactly where you stand before an exam." },
              { icon: Award, title: "Streak & motivation system", desc: "Daily streaks, goal tracking, and study insights keep you consistent without being gamified to the point of distraction." },
            ].map((item, i) => (
              <FadeIn key={item.title} delay={i * 80}>
                <div className="flex gap-4 p-5 rounded-xl border border-border bg-background">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Student stories</p>
            <h2 className="text-4xl font-bold tracking-tight">Trusted by students who mean it</h2>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <FadeIn key={t.name} delay={i * 100}>
                <div className="p-6 rounded-xl border border-border bg-card flex flex-col h-full">
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed flex-1">"{t.text}"</p>
                  <div className="flex items-center gap-3 mt-5 pt-4 border-t border-border">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {t.avatar}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{t.name}</p>
                      <p className="text-[11px] text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 bg-card/40 border-y border-border/50">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Pricing</p>
            <h2 className="text-4xl font-bold tracking-tight">Simple, transparent pricing</h2>
            <p className="mt-4 text-muted-foreground">Start free. Upgrade when you're ready.</p>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-5 items-start">
            {PRICING.map((plan, i) => (
              <FadeIn key={plan.name} delay={i * 80}>
                <div className={cn("rounded-xl border p-6 relative", plan.highlight ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" : "border-border bg-background")}>
                  {plan.highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                      Most popular
                    </span>
                  )}
                  <div className="mb-5">
                    <h3 className="font-bold text-foreground">{plan.name}</h3>
                    <p className="text-muted-foreground text-xs mt-0.5">{plan.desc}</p>
                    <div className="mt-3 flex items-end gap-1">
                      <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                      <span className="text-muted-foreground text-sm mb-0.5">/{plan.period}</span>
                    </div>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/register">
                    <span className={cn("block w-full text-center py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer",
                      plan.highlight
                        ? "bg-primary text-primary-foreground hover:opacity-90"
                        : "border border-border text-foreground hover:bg-secondary"
                    )}>
                      {plan.cta}
                    </span>
                  </Link>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-6">
        <div className="max-w-2xl mx-auto">
          <FadeIn className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">FAQ</p>
            <h2 className="text-4xl font-bold tracking-tight">Common questions</h2>
          </FadeIn>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <FadeIn key={i} delay={i * 50}>
                <div className="border border-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/50 transition-colors"
                    data-testid={`faq-${i}`}
                  >
                    <span className="font-medium text-sm text-foreground">{faq.q}</span>
                    <ChevronRight className={cn("w-4 h-4 text-muted-foreground shrink-0 transition-transform", openFaq === i && "rotate-90")} />
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border">
                      <div className="pt-3">{faq.a}</div>
                    </div>
                  )}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-primary text-primary-foreground">
        <div className="max-w-2xl mx-auto text-center">
          <FadeIn>
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 mx-auto mb-6">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h2 className="text-4xl font-bold tracking-tight mb-4">Ready to study smarter?</h2>
            <p className="text-primary-foreground/80 mb-8 leading-relaxed">
              Join 2.4 million students who've transformed how they learn. Start free today.
            </p>
            <Link href="/register">
              <span className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-primary font-semibold hover:opacity-95 transition-all hover:shadow-xl hover:shadow-black/20 cursor-pointer">
                Get started — it's free
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary">
              <GraduationCap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-foreground">BrainPilot AI</span>
          </div>
          <div className="flex items-center gap-5 text-xs">
            <span>Your Intelligent AI Study Companion</span>
            <span>© 2026 BrainPilot AI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
