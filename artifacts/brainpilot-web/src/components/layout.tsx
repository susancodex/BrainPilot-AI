import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
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
  Sun
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

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Chat", href: "/chat", icon: MessageSquare },
  { name: "Planner", href: "/planner", icon: CalendarDays },
  { name: "Goals", href: "/goals", icon: Target },
  { name: "Revision", href: "/revision", icon: BookOpen },
  { name: "Notes", href: "/notes", icon: FileText },
  { name: "Quizzes", href: "/quizzes", icon: BrainCircuit },
  { name: "Analytics", href: "/analytics", icon: BarChart2 },
  { name: "Productivity", href: "/productivity", icon: Clock },
  { name: "Notifications", href: "/notifications", icon: Bell },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <SidebarProvider>
      <div className="min-h-[100dvh] flex w-full">
        <Sidebar className="border-r border-sidebar-border bg-sidebar">
          <SidebarHeader className="p-4">
            <div className="flex items-center gap-2 px-2 font-bold text-lg text-sidebar-primary">
              <BrainCircuit className="h-6 w-6" />
              <span>BrainPilot AI</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton
                        asChild
                        isActive={location === item.href}
                        tooltip={item.name}
                      >
                        <Link href={item.href} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  data-testid="button-toggle-theme"
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex items-center gap-3 px-2 py-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col flex-1 overflow-hidden">
                  <span className="text-sm font-medium truncate">{user?.name || "User"}</span>
                  <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1 justify-start" asChild>
                  <Link href="/profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => logout.mutate()} data-testid="button-logout">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>
        
        <main className="flex-1 flex flex-col min-h-[100dvh] overflow-hidden bg-background">
          <header className="h-14 border-b border-border flex items-center px-4 md:hidden bg-background sticky top-0 z-10">
            <SidebarTrigger />
            <div className="ml-4 font-bold text-primary">BrainPilot AI</div>
          </header>
          <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
