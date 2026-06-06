import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
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

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/notes", label: "Notes", icon: FileText },
  { href: "/chat", label: "AI Tutor", icon: MessageSquare },
  { href: "/quizzes", label: "Quizzes", icon: BrainCircuit },
  { href: "/flashcards", label: "Flashcards", icon: Layers },
  { href: "/pdfs", label: "PDF Library", icon: File },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/planner", label: "Planner", icon: Calendar },
  { href: "/revision", label: "Revision", icon: RotateCcw },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/productivity", label: "Focus", icon: Timer },
  { href: "/subscription", label: "Subscription", icon: CreditCard },
];

interface LayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: LayoutProps) {
  return <Layout>{children}</Layout>;
}

function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { data: notifications } = useNotifications();
  const { theme, setTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const notifData = notifications as { unread_count?: number; notifications?: Notification[] } | undefined;
  const notifList = notifData?.notifications ?? [];
  const unreadCount = notifData?.unread_count ?? notifList.filter((n) => !n.is_read).length;

  const isActive = (href: string) => location === href || location.startsWith(`${href}/`);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className={cn("px-4 py-4 border-b border-border", collapsed && "flex justify-center px-2")}>
        {collapsed ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BrainCircuit className="h-4 w-4" />
          </div>
        ) : (
          <BrandMark compact subtitle="Study workspace" />
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            aria-current={isActive(href) ? "page" : undefined}
            className={cn(
              "w-full flex items-center gap-3 px-3 min-h-[44px] py-2.5 rounded-lg text-sm font-medium transition-colors group",
              isActive(href)
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
              collapsed && "justify-center px-2"
            )}
            title={collapsed ? label : undefined}
          >
            <Icon className={cn("w-4 h-4 shrink-0", isActive(href) ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}

        {user?.is_staff && (
          <>
            <div className={cn("pt-2 pb-1", !collapsed && "px-3")}>
              {!collapsed && <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">Admin</p>}
              {collapsed && <div className="border-t border-border my-1" />}
            </div>
            <Link
              href="/admin/users"
              onClick={() => setMobileOpen(false)}
              aria-current={location === "/admin/users" || location === "/admin" ? "page" : undefined}
              className={cn(
                "w-full flex items-center gap-3 px-3 min-h-[44px] py-2.5 rounded-lg text-sm font-medium transition-colors group",
                location === "/admin/users" || location === "/admin"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? "Admin Portal" : undefined}
            >
              <Shield className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Admin Portal</span>}
            </Link>
            <Link
              href="/admin/ai-health"
              onClick={() => setMobileOpen(false)}
              aria-current={location === "/admin/ai-health" ? "page" : undefined}
              className={cn(
                "w-full flex items-center gap-3 px-3 min-h-[44px] py-2.5 rounded-lg text-sm font-medium transition-colors group",
                location === "/admin/ai-health"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? "AI Health" : undefined}
            >
              <Activity className="w-4 h-4 shrink-0" />
              {!collapsed && <span>AI Health</span>}
            </Link>
          </>
        )}
      </nav>

      {/* Bottom user section */}
      <div className={cn("border-t border-border p-3", collapsed && "px-2")}>
        <div className={cn("flex items-center gap-2", collapsed && "flex-col")}>
          {/* Notifications */}
          <Link
            href="/notifications"
            onClick={() => setMobileOpen(false)}
            aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
            className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md hover:bg-muted"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 shrink-0"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* Profile */}
          {!collapsed && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex-1 justify-start gap-2 h-8 px-2 min-w-0">
                  <UserAvatar
                    firstName={user?.first_name}
                    lastName={user?.last_name}
                    avatarUrl={user?.profile?.avatar_url}
                    avatarPreset={
                      user?.profile?.avatar_url ? null : user?.profile?.avatar_preset
                    }
                    cacheVersion={user?.profile?.updated_at}
                    className="h-6 w-6"
                    fallbackClassName="text-[10px]"
                  />
                  <span className="text-sm font-medium truncate">{user?.first_name ?? "User"}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile"><User className="w-4 h-4 mr-2" />Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => logout.mutate()}
                >
                  <LogOut className="w-4 h-4 mr-2" />Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {collapsed && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <UserAvatar
                    firstName={user?.first_name}
                    lastName={user?.last_name}
                    avatarUrl={user?.profile?.avatar_url}
                    avatarPreset={
                      user?.profile?.avatar_url ? null : user?.profile?.avatar_preset
                    }
                    cacheVersion={user?.profile?.updated_at}
                    className="h-6 w-6"
                    fallbackClassName="text-[10px]"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile"><User className="w-4 h-4 mr-2" />Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => logout.mutate()}>
                  <LogOut className="w-4 h-4 mr-2" />Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden max-w-[100vw]">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-border bg-card transition-all duration-200 shrink-0 relative",
          collapsed ? "w-14" : "w-56"
        )}
      >
        <NavContent />
        {/* Collapse toggle */}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-6 w-6 h-6 bg-background border border-border rounded-full flex items-center justify-center hover:bg-muted transition-colors z-10 shadow-sm"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-[min(16rem,85vw)] bg-card border-r border-border flex flex-col z-10 overscroll-contain">
            <div className="flex items-center justify-end border-b border-border px-2 py-1 md:hidden">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation menu"
                className="inline-flex h-11 w-11 items-center justify-center rounded-md hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between gap-2 px-4 py-2 border-b border-border bg-card shrink-0 min-w-0">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md hover:bg-muted"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>
          <BrandMark compact className="min-w-0 flex-1 justify-center" />
          <Link
            href="/notifications"
            aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
            className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md hover:bg-muted"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Link>
        </div>

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
