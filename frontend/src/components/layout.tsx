import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import type { Notification } from "@/types";
import { BrandMark } from "@/components/brand-mark";
import {
  BrainCircuit, LayoutDashboard, FileText, MessageSquare, Layers,
  Target, Calendar, RotateCcw, BarChart2, Timer, Bell, User,
  LogOut, Moon, Sun, ChevronLeft, ChevronRight,
  Shield, Menu, File, CreditCard, X, Activity,
} from "lucide-react";
import { useState, useEffect } from "react";

// ── Navigation structure ────────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard", label: "Dashboard",   icon: LayoutDashboard },
      { href: "/notes",     label: "Notes",        icon: FileText },
      { href: "/chat",      label: "AI Tutor",     icon: MessageSquare },
    ],
  },
  {
    label: "Learn",
    items: [
      { href: "/quizzes",   label: "Quizzes",      icon: BrainCircuit },
      { href: "/flashcards",label: "Flashcards",   icon: Layers },
      { href: "/revision",  label: "Revision",     icon: RotateCcw },
      { href: "/pdfs",      label: "PDF Library",  icon: File },
    ],
  },
  {
    label: "Plan",
    items: [
      { href: "/goals",     label: "Goals",        icon: Target },
      { href: "/planner",   label: "Planner",      icon: Calendar },
      { href: "/productivity", label: "Focus",     icon: Timer },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/analytics", label: "Analytics",   icon: BarChart2 },
    ],
  },
];

interface LayoutProps { children: React.ReactNode }

export function AppLayout({ children }: LayoutProps) {
  return <Layout>{children}</Layout>;
}

function Layout({ children }: LayoutProps) {
  const [location]               = useLocation();
  const { user, logout }         = useAuth();
  const { data: notifications }  = useNotifications();
  const { theme, setTheme }      = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const notifData   = notifications as { unread_count?: number; notifications?: Notification[] } | undefined;
  const notifList   = notifData?.notifications ?? [];
  const unreadCount = notifData?.unread_count ?? notifList.filter((n) => !n.is_read).length;

  const isActive = (href: string) => location === href || location.startsWith(`${href}/`);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [mobileOpen]);

  function NavLink({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
    const active = isActive(href);
    return (
      <Link
        href={href}
        onClick={() => setMobileOpen(false)}
        aria-current={active ? "page" : undefined}
        title={collapsed ? label : undefined}
        className={cn(
          "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
          "min-h-[36px]",
          active
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
          collapsed && "justify-center px-2",
        )}
      >
        <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "")} />
        {!collapsed && <span className="truncate">{label}</span>}
      </Link>
    );
  }

  function NavContent() {
    return (
      <>
        {/* Brand */}
        <div className={cn(
          "flex shrink-0 items-center border-b border-border px-4 py-[14px]",
          collapsed && "justify-center px-2"
        )}>
          {collapsed
            ? <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <BrainCircuit className="h-4 w-4" />
              </div>
            : <BrandMark compact subtitle="Study workspace" />
          }
        </div>

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-5">
          {NAV_GROUPS.map(({ label, items }) => (
            <div key={label}>
              {!collapsed && (
                <p className="mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                  {label}
                </p>
              )}
              {collapsed && <div className="mb-1 border-t border-border/60 mx-1" />}
              <div className="space-y-0.5">
                {items.map((item) => (
                  <NavLink key={item.href} {...item} />
                ))}
              </div>
            </div>
          ))}

          {/* Admin group */}
          {user?.is_staff && (
            <div>
              {!collapsed && (
                <p className="mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                  Admin
                </p>
              )}
              {collapsed && <div className="mb-1 border-t border-border/60 mx-1" />}
              <div className="space-y-0.5">
                <NavLink href="/admin/users"     label="Admin Portal" icon={Shield} />
                <NavLink href="/admin/ai-health" label="AI Health"    icon={Activity} />
              </div>
            </div>
          )}
        </nav>

        {/* Footer: notifications + theme + user */}
        <div className="shrink-0 border-t border-border px-2 py-2">
          <div className={cn("flex items-center gap-1", collapsed && "flex-col")}>

            <Link
              href="/notifications"
              onClick={() => setMobileOpen(false)}
              aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
              className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Sun  className="h-4 w-4 rotate-0    scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0   transition-all dark:rotate-0  dark:scale-100" />
            </button>

            {/* Subscription */}
            {!collapsed && (
              <Link
                href="/subscription"
                onClick={() => setMobileOpen(false)}
                title="Subscription"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <CreditCard className="h-4 w-4" />
              </Link>
            )}

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {collapsed
                  ? <button
                      type="button"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md hover:bg-muted"
                    >
                      <UserAvatar
                        firstName={user?.first_name}
                        lastName={user?.last_name}
                        avatarUrl={user?.profile?.avatar_url}
                        avatarPreset={user?.profile?.avatar_url ? null : user?.profile?.avatar_preset}
                        cacheVersion={user?.profile?.updated_at}
                        className="h-6 w-6"
                        fallbackClassName="text-[10px]"
                      />
                    </button>
                  : <button
                      type="button"
                      className="ml-auto flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                    >
                      <UserAvatar
                        firstName={user?.first_name}
                        lastName={user?.last_name}
                        avatarUrl={user?.profile?.avatar_url}
                        avatarPreset={user?.profile?.avatar_url ? null : user?.profile?.avatar_preset}
                        cacheVersion={user?.profile?.updated_at}
                        className="h-6 w-6 shrink-0"
                        fallbackClassName="text-[10px]"
                      />
                      <span className="truncate text-sm font-medium text-foreground">
                        {user?.first_name ?? "Account"}
                      </span>
                    </button>
                }
              </DropdownMenuTrigger>

              <DropdownMenuContent
                side={collapsed ? "right" : "top"}
                align={collapsed ? "end" : "end"}
                className="w-52"
              >
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-foreground">{user?.full_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile"><User className="mr-2 h-4 w-4" />Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => logout.mutate()}
                >
                  <LogOut className="mr-2 h-4 w-4" />Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">

      {/* Desktop sidebar */}
      <aside className={cn(
        "relative hidden shrink-0 flex-col border-r border-border bg-card transition-[width] duration-200 md:flex",
        collapsed ? "w-[52px]" : "w-[220px]",
      )}>
        <NavContent />

        {/* Collapse toggle */}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "absolute -right-3 top-[22px] z-10 flex h-6 w-6 items-center justify-center",
            "rounded-full border border-border bg-background shadow-sm",
            "text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
          )}
        >
          {collapsed
            ? <ChevronRight className="h-3 w-3" />
            : <ChevronLeft  className="h-3 w-3" />
          }
        </button>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-[min(220px,85vw)] flex-col border-r border-border bg-card">
            <div className="flex items-center justify-end border-b border-border px-2 py-1.5">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation menu"
                className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <NavContent />
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* Mobile top bar */}
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-card px-3 py-2 md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>
          <BrandMark compact />
          <Link
            href="/notifications"
            aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
            className="relative flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </Link>
        </div>

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
