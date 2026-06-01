import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import Layout from "@/components/Layout";
import LandingPage from "@/pages/Landing";
import LoginPage from "@/pages/Login";
import RegisterPage from "@/pages/Register";
import DashboardPage from "@/pages/Dashboard";
import ChatListPage from "@/pages/ChatList";
import ChatPage from "@/pages/Chat";
import PlannerPage from "@/pages/Planner";
import FlashcardsPage from "@/pages/Flashcards";
import FlashcardStudyPage from "@/pages/FlashcardStudy";
import QuizzesPage from "@/pages/Quizzes";
import QuizPage from "@/pages/Quiz";
import RevisionsPage from "@/pages/Revisions";
import PdfsPage from "@/pages/Pdfs";
import GoalsPage from "@/pages/Goals";
import SettingsPage from "@/pages/Settings";
import NotificationsPage from "@/pages/Notifications";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/dashboard">
        {() => <Layout><DashboardPage /></Layout>}
      </Route>
      <Route path="/chat">
        {() => <Layout><ChatListPage /></Layout>}
      </Route>
      <Route path="/chat/:id">
        {(params) => <Layout><ChatPage id={Number(params.id)} /></Layout>}
      </Route>
      <Route path="/planner">
        {() => <Layout><PlannerPage /></Layout>}
      </Route>
      <Route path="/flashcards">
        {() => <Layout><FlashcardsPage /></Layout>}
      </Route>
      <Route path="/flashcards/:id">
        {(params) => <Layout><FlashcardStudyPage id={Number(params.id)} /></Layout>}
      </Route>
      <Route path="/quizzes">
        {() => <Layout><QuizzesPage /></Layout>}
      </Route>
      <Route path="/quizzes/:id">
        {(params) => <Layout><QuizPage id={Number(params.id)} /></Layout>}
      </Route>
      <Route path="/revisions">
        {() => <Layout><RevisionsPage /></Layout>}
      </Route>
      <Route path="/pdfs">
        {() => <Layout><PdfsPage /></Layout>}
      </Route>
      <Route path="/goals">
        {() => <Layout><GoalsPage /></Layout>}
      </Route>
      <Route path="/settings">
        {() => <Layout><SettingsPage /></Layout>}
      </Route>
      <Route path="/notifications">
        {() => <Layout><NotificationsPage /></Layout>}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppRoutes />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
