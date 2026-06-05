import { lazy, Suspense, useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { ErrorBoundary } from "@/components/error-boundary";
import { PageLoader } from "@/components/page-loader";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import VerifyEmail from "@/pages/verify-email";
import PasswordReset from "@/pages/password-reset";
import PasswordResetConfirm from "@/pages/password-reset-confirm";

import Dashboard from "@/pages/dashboard";
import Planner from "@/pages/planner";
import Goals from "@/pages/goals";
import Revision from "@/pages/revision";
import Flashcards from "@/pages/flashcards";
import Quizzes from "@/pages/quizzes";
import Productivity from "@/pages/productivity";
import Notifications from "@/pages/notifications";
import Profile from "@/pages/profile";
import AdminUsers from "@/pages/admin/users";
import PDFs from "@/pages/pdfs";
import Subscription from "@/pages/subscription";

import { AppLayout } from "@/components/layout";
import { PrivateRoute } from "@/components/private-route";
import { AdminRoute } from "@/components/admin-route";

const Chat = lazy(() => import("@/pages/chat"));
const Notes = lazy(() => import("@/pages/notes"));
const Analytics = lazy(() => import("@/pages/analytics"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status === 401 || status === 403) return false;
        return failureCount < 1;
      },
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

function AuthExpiredListener() {
  const [, navigate] = useLocation();

  useEffect(() => {
    const handleAuthExpired = () => navigate("/");
    window.addEventListener("brainpilot:auth-expired", handleAuthExpired);
    return () => {
      window.removeEventListener("brainpilot:auth-expired", handleAuthExpired);
    };
  }, [navigate]);

  return null;
}

function PrivateRoutes() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/chat">
          {() => (
            <LazyPage>
              <Chat />
            </LazyPage>
          )}
        </Route>
        <Route path="/planner" component={Planner} />
        <Route path="/goals" component={Goals} />
        <Route path="/revision" component={Revision} />
        <Route path="/notes">
          {() => (
            <LazyPage>
              <Notes />
            </LazyPage>
          )}
        </Route>
        <Route path="/flashcards" component={Flashcards} />
        <Route path="/quizzes" component={Quizzes} />
        <Route path="/analytics">
          {() => (
            <LazyPage>
              <Analytics />
            </LazyPage>
          )}
        </Route>
        <Route path="/productivity" component={Productivity} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/profile" component={Profile} />
        <Route path="/pdfs" component={PDFs} />
        <Route path="/subscription" component={Subscription} />
        <Route path="/admin/users">{() => <AdminRoute component={AdminUsers} />}</Route>
        <Route path="/admin">{() => <AdminRoute component={AdminUsers} />}</Route>
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function Router() {
  return (
    <>
      <AuthExpiredListener />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/verify-email" component={VerifyEmail} />
        <Route path="/password-reset" component={PasswordReset} />
        <Route path="/password-reset/confirm" component={PasswordResetConfirm} />
        <Route path="/(.*)">
          <PrivateRoute component={PrivateRoutes} />
        </Route>
      </Switch>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
