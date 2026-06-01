import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";
import { useListNotifications } from "@workspace/api-client-react";
import {
  LayoutDashboard, MessageSquare, Calendar, BookOpen,
  Brain, FileText, Target, RotateCcw, Bell, Settings,
  Moon, Sun, Menu, X, GraduationCap, ChevronRight
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat", label: "AI Chat", icon: MessageSquare },
  { href: "/planner", label: "Planner", icon: Calendar },
  { href: "/flashcards", label: "Flashcards", icon: BookOpen },
  { href: "/quizzes", label: "Quizzes", icon: Brain },
  { href: "/revisions", label: "Revisions", icon: RotateCcw },
  { href: "/pdfs", label: "PDF Library", icon: FileText },
  { href: "/goals", label: "Goals", icon: Target },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: notifications } = useListNotifications();
  const unread = (notifications ?? []).filter((n) => !n.read).length;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-60 flex flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-sidebar-border">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
            <GraduationCap className="w-4.5 h-4.5 text-white" strokeWidth={2} />
          </div>
          <div>
            <span className="font-semibold text-sm text-sidebar-foreground tracking-tight">BrainPilot</span>
            <span className="block text-[10px] text-muted-foreground -mt-0.5 font-medium">AI</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Study</p>
          {NAV.slice(0, 5).map(({ href, label, icon: Icon }) => {
            const active = location === href || location.startsWith(href + "/");
            return (
              <Link key={href} href={href} onClick={() => setSidebarOpen(false)}>
                <span
                  data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer mb-0.5",
                    active
                      ? "bg-primary text-white"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                  {active && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" />}
                </span>
              </Link>
            );
          })}

          <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mt-4 mb-1.5">Resources</p>
          {NAV.slice(5).map(({ href, label, icon: Icon }) => {
            const active = location === href;
            return (
              <Link key={href} href={href} onClick={() => setSidebarOpen(false)}>
                <span
                  data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer mb-0.5",
                    active
                      ? "bg-primary text-white"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                  {active && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" />}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="border-t border-sidebar-border p-2 flex items-center gap-1">
          <Link href="/notifications" onClick={() => setSidebarOpen(false)}>
            <span className="relative flex items-center justify-center w-8 h-8 rounded-md hover:bg-sidebar-accent transition-colors cursor-pointer" data-testid="nav-notifications">
              <Bell className="w-4 h-4 text-sidebar-foreground" />
              {unread > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
              )}
            </span>
          </Link>
          <Link href="/settings" onClick={() => setSidebarOpen(false)}>
            <span className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-sidebar-accent transition-colors cursor-pointer" data-testid="nav-settings">
              <Settings className="w-4 h-4 text-sidebar-foreground" />
            </span>
          </Link>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-sidebar-accent transition-colors ml-auto"
            data-testid="toggle-theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-sidebar-foreground" /> : <Moon className="w-4 h-4 text-sidebar-foreground" />}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-foreground" data-testid="mobile-menu">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary">
              <GraduationCap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-sm">BrainPilot AI</span>
          </div>
          {sidebarOpen && (
            <button onClick={() => setSidebarOpen(false)} className="ml-auto text-foreground">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
