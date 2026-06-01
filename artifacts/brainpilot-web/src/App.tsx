import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import NotFound from "@/pages/not-found";

import Login from "@/pages/login";
import Register from "@/pages/register";
import VerifyEmail from "@/pages/verify-email";
import PasswordReset from "@/pages/password-reset";
import PasswordResetConfirm from "@/pages/password-reset-confirm";

import Dashboard from "@/pages/dashboard";
import Chat from "@/pages/chat";
import Planner from "@/pages/planner";
import Goals from "@/pages/goals";
import Revision from "@/pages/revision";
import Notes from "@/pages/notes";
import Flashcards from "@/pages/flashcards";
import Quizzes from "@/pages/quizzes";
import Analytics from "@/pages/analytics";
import Productivity from "@/pages/productivity";
import Notifications from "@/pages/notifications";
import Profile from "@/pages/profile";
import AdminUsers from "@/pages/admin/users";

import { AppLayout } from "@/components/layout";
import { PrivateRoute } from "@/components/private-route";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function PrivateRoutes() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/chat" component={Chat} />
        <Route path="/planner" component={Planner} />
        <Route path="/goals" component={Goals} />
        <Route path="/revision" component={Revision} />
        <Route path="/notes" component={Notes} />
        <Route path="/flashcards" component={Flashcards} />
        <Route path="/quizzes" component={Quizzes} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/productivity" component={Productivity} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/profile" component={Profile} />
        <Route path="/admin/users" component={AdminUsers} />
        <Route path="/admin" component={AdminUsers} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/password-reset" component={PasswordReset} />
      <Route path="/password-reset/confirm" component={PasswordResetConfirm} />
      <Route path="/(.*)">
        <PrivateRoute component={PrivateRoutes} />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
