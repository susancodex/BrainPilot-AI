import { lazy, Suspense, useEffect, ComponentType } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { ErrorBoundary } from "@/components/error-boundary";
import { PageLoader } from "@/components/page-loader";

import { AppLayout } from "@/components/layout";
import { PrivateRoute } from "@/components/private-route";
import { AdminRoute } from "@/components/admin-route";

// Eagerly loaded: tiny utility pages that must resolve instantly
import NotFound from "@/pages/not-found";

/**
 * Wraps React.lazy so that each lazy page carries its own Suspense boundary.
 * This lets us keep using wouter's `component` prop directly.
 */
function lazyPage<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): ComponentType {
  const Lazy = lazy(factory);
  return function LazyPageWrapper() {
    return (
      <Suspense fallback={<PageLoader />}>
        <Lazy />
      </Suspense>
    );
  };
}

// ── Public pages ────────────────────────────────────────────────────────────
const Home                = lazyPage(() => import("@/pages/home"));
const Login               = lazyPage(() => import("@/pages/login"));
const Register            = lazyPage(() => import("@/pages/register"));
const VerifyEmail         = lazyPage(() => import("@/pages/verify-email"));
const PasswordReset       = lazyPage(() => import("@/pages/password-reset"));
const PasswordResetConfirm = lazyPage(() => import("@/pages/password-reset-confirm"));

// ── App pages (all behind PrivateRoute) ────────────────────────────────────
const Dashboard     = lazyPage(() => import("@/pages/dashboard"));
const Chat          = lazyPage(() => import("@/pages/chat"));
const Notes         = lazyPage(() => import("@/pages/notes"));
const Planner       = lazyPage(() => import("@/pages/planner"));
const Goals         = lazyPage(() => import("@/pages/goals"));
const Revision      = lazyPage(() => import("@/pages/revision"));
const Flashcards    = lazyPage(() => import("@/pages/flashcards"));
const Quizzes       = lazyPage(() => import("@/pages/quizzes"));
const Analytics     = lazyPage(() => import("@/pages/analytics"));
const Productivity  = lazyPage(() => import("@/pages/productivity"));
const Notifications = lazyPage(() => import("@/pages/notifications"));
const Profile       = lazyPage(() => import("@/pages/profile"));
const PDFs          = lazyPage(() => import("@/pages/pdfs"));
const Subscription  = lazyPage(() => import("@/pages/subscription"));

// ── Admin pages ────────────────────────────────────────────────────────────
const AdminUsers      = lazyPage(() => import("@/pages/admin/users"));
const AiHealthDashboard = lazyPage(() => import("@/pages/admin/ai-health"));

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

function PrivateRoutes() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/dashboard"        component={Dashboard} />
        <Route path="/chat"             component={Chat} />
        <Route path="/notes"            component={Notes} />
        <Route path="/planner"          component={Planner} />
        <Route path="/goals"            component={Goals} />
        <Route path="/revision"         component={Revision} />
        <Route path="/flashcards"       component={Flashcards} />
        <Route path="/quizzes"          component={Quizzes} />
        <Route path="/analytics"        component={Analytics} />
        <Route path="/productivity"     component={Productivity} />
        <Route path="/notifications"    component={Notifications} />
        <Route path="/profile"          component={Profile} />
        <Route path="/pdfs"             component={PDFs} />
        <Route path="/subscription"     component={Subscription} />
        <Route path="/admin/users">
          {() => <AdminRoute component={AdminUsers} />}
        </Route>
        <Route path="/admin/ai-health">
          {() => <AdminRoute component={AiHealthDashboard} />}
        </Route>
        <Route path="/admin">
          {() => <AdminRoute component={AdminUsers} />}
        </Route>
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/"                      component={Home} />
      <Route path="/login"                 component={Login} />
      <Route path="/register"              component={Register} />
      <Route path="/verify-email"          component={VerifyEmail} />
      <Route path="/password-reset"        component={PasswordReset} />
      <Route path="/password-reset/confirm" component={PasswordResetConfirm} />
      <Route path="/(.*)">
        <PrivateRoute component={PrivateRoutes} />
      </Route>
    </Switch>
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
