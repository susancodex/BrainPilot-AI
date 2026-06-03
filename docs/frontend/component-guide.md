# Frontend Component Guide

## Architecture

The frontend is a React 19 SPA built with Vite 7. It follows a strict separation between data-fetching logic (hooks) and rendering logic (components/pages).

```
frontend/src/
├── components/
│   ├── ui/             shadcn/ui primitives — do not modify directly
│   ├── layout.tsx      Application shell (sidebar, header, nav)
│   ├── error-boundary.tsx  React error boundary wrapper
│   └── private-route.tsx   Route guard for authenticated pages
│
├── hooks/              All API communication lives here
│   ├── use-auth.ts     Authentication mutations (login, register, logout)
│   ├── use-notes.ts    Notes CRUD + AI operations
│   ├── use-quizzes.ts  Quiz generation and submission
│   ├── use-chat.ts     Chatbot messages + SSE streaming
│   └── ...             One hook file per domain module
│
├── pages/              Route-level components
│   ├── dashboard.tsx
│   ├── notes.tsx
│   ├── quizzes.tsx
│   ├── chat.tsx
│   └── ...
│
├── store/
│   └── timer.ts        Zustand store for Pomodoro timer state
│
├── lib/
│   ├── api.ts          Axios instance with auth interceptors
│   ├── auth.ts         Token storage and JWT decode helpers
│   └── utils.ts        Tailwind class merge utility (cn)
│
└── types/
    └── index.ts        TypeScript interfaces for all domain objects
```

## Key Conventions

### API calls belong in hooks

Never call `api.get()` or `api.post()` directly in a component or page. Every API interaction lives in a hook in `src/hooks/`.

```tsx
// Correct
const { notes, isLoading } = useNotes();

// Wrong — do not do this in a component
const [notes, setNotes] = useState([]);
useEffect(() => { api.get("/notes/").then(...) }, []);
```

### Server state vs. client state

- **TanStack Query** manages server state (anything fetched from the API)
- **Zustand** manages client-only state (Pomodoro timer, UI state)
- Do not store API responses in Zustand

### Component size

Page components should be orchestrators — they compose smaller components and pass data from hooks. If a component exceeds ~150 lines, consider extracting a child component.

## UI Components

The `src/components/ui/` directory contains shadcn/ui primitives. These are source-owned (not installed from npm) and can be customised, but prefer extending over replacing.

Import and use them directly:

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
```

## Authentication Flow

1. `useAuth().login.mutate(credentials)` posts to `/api/v1/auth/login/`
2. On success, `setTokens(access, refresh)` stores tokens in `localStorage`
3. The Axios instance in `lib/api.ts` reads `localStorage` and injects `Authorization: Bearer <token>` on every request
4. When a request returns `401`, the interceptor attempts a token refresh automatically
5. If refresh fails, `clearTokens()` is called and the user is redirected to `/login`

## SSE Streaming (Chatbot)

The chatbot uses Server-Sent Events for word-by-word streaming:

```tsx
const source = new EventSource("/api/v1/chatbot/send/stream/", {
  // headers injected via a custom EventSource wrapper
});

source.addEventListener("chunk", (event) => {
  const { content } = JSON.parse(event.data);
  setPartialMessage((prev) => prev + content);
});

source.addEventListener("done", () => {
  source.close();
});
```

## Path Aliases

The `@/` alias resolves to `frontend/src/`. Always use it for imports within `src/`:

```tsx
import { useNotes } from "@/hooks/use-notes";
import type { Note } from "@/types";
import { cn } from "@/lib/utils";
```

## Routing

Routing uses [wouter](https://github.com/molefrog/wouter) — a lightweight alternative to React Router.

```tsx
import { Route, Switch, useLocation } from "wouter";

<Switch>
  <Route path="/dashboard" component={Dashboard} />
  <Route path="/notes/:id" component={NoteDetail} />
</Switch>
```

## Adding a New Page

1. Create `src/pages/your-page.tsx`
2. Add a `useYourFeature` hook in `src/hooks/use-your-feature.ts` for any API calls
3. Register the route in `src/App.tsx`
4. Add a navigation item in `src/components/layout.tsx`
