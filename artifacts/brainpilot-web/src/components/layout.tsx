import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useNotifications } from "@/hooks/use-notifications";
import { useStreak } from "@/hooks/use-productivity";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MessageSquare,
  CalendarDays,
  Target,
  BookOpen,
  FileText,
  BrainCircuit,
  BarChart2,
  Clock,
  Bell,
  User,
  LogOut,
  Moon,
  Sun,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Chat", href: "/chat", icon: MessageSquare },
  { name: "Planner", href: "/planner", icon: CalendarDays },
  { name: "Goals", href: "/goals", icon: Target },
  { name: "Revision", href: "/revision", icon: BookOpen },
  { name: "Notes", href: "/notes", icon: FileText },
  { name: "Flashcards", href: "/flashcards", icon: Layers },
  { name: "Quizzes", href: "/quizzes", icon: BrainCircuit },
  { name: "Analytics", href: "/analytics", icon: BarChart2 },
  { name: "Productivity", href: "/productivity", icon: Clock },
  { name: "Notifications", href: "/notifications", icon: Bell },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  
  const { data: notifications } = useNotifications();
  const { data: streakData } = useStreak();
  
  const unreadCount = notifications?.filter((n: any) => !n.is_read).length || 0;

  return (
    <SidebarProvider>
      <div className="min-h-[100dvh] flex w-full">
        <Sidebar className="border-r border-sidebar-border bg-sidebar">
          <SidebarHeader className="p-4">
            <div className="flex items-center gap-3 px-2 font-bold text-xl text-sidebar-primary tracking-tight">
              <div className="bg-primary text-primary-foreground p-1.5 rounded-lg shadow-sm">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <span>BrainPilot</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1 px-2">
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton
                        asChild
                        isActive={location === item.href}
                        tooltip={item.name}
                        className={cn(
                          "transition-colors rounded-md h-10",
                          location === item.href ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
                        )}
                      >
                        <Link href={item.href} className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <item.icon className="h-4 w-4" />
                            <span>{item.name}</span>
                          </div>
                          {item.name === "Notifications" && unreadCount > 0 && (
                            <Badge variant="destructive" className="h-5 min-w-5 flex items-center justify-center rounded-full px-1 text-[10px]">
                              {unreadCount}
                            </Badge>
                          )}
                          {item.name === "Productivity" && (streakData?.current_streak || 0) > 0 && (
                            <Badge variant="outline" className="h-5 flex items-center gap-1 border-orange-500/30 bg-orange-500/10 text-orange-500 px-1.5 text-[10px]">
                              🔥 {streakData.current_streak}
                            </Badge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-sidebar-border">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  data-testid="button-toggle-theme"
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex items-center gap-3 px-2 py-2 mt-2 bg-muted/50 rounded-lg border border-border shadow-sm">
                <Avatar className="h-8 w-8 border border-background">
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold">{user?.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col flex-1 overflow-hidden">
                  <span className="text-sm font-semibold truncate text-foreground">{user?.name || "User"}</span>
                  <span className="text-[10px] text-muted-foreground truncate uppercase tracking-wider">{user?.profile?.academic_level || "Student"}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <Button variant="ghost" className="flex-1 justify-start h-9 text-xs" asChild>
                  <Link href="/profile" className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5" />
                    <span>Profile</span>
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive" onClick={() => logout.mutate()} data-testid="button-logout">
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>
        
        <main className="flex-1 flex flex-col min-h-[100dvh] overflow-hidden bg-background">
          <header className="h-14 border-b border-border flex items-center px-4 md:hidden bg-card sticky top-0 z-10 shadow-sm">
            <SidebarTrigger />
            <div className="ml-4 font-bold text-lg tracking-tight flex items-center gap-2 text-foreground">
              <BrainCircuit className="w-5 h-5 text-primary" /> BrainPilot
            </div>
          </header>
          <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 bg-muted/10">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
