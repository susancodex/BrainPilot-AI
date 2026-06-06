import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import api from "@/lib/api";
import { Redirect } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity, CheckCircle2, XCircle, AlertTriangle,
  RefreshCw, Zap, Clock, BarChart2, ArrowRight,
  Layers,
} from "lucide-react";
import type { AiProviderHealth, AiHealthReport } from "@/hooks/use-ai-health";

const PROVIDER_META: Record<string, { label: string; color: string; description: string }> = {
  gemini: {
    label: "Google Gemini",
    color: "bg-blue-500",
    description: "Primary — gemini-2.5-flash",
  },
  groq: {
    label: "Groq",
    color: "bg-purple-500",
    description: "Fallback 1 — llama-3.3-70b-versatile",
  },
  openrouter: {
    label: "OpenRouter",
    color: "bg-orange-500",
    description: "Fallback 2 — free model pool",
  },
};

function useAiHealthDashboard() {
  return useQuery({
    queryKey: ["ai", "health"],
    queryFn: async () => {
      const { data } = await api.get<AiHealthReport>("/ai/health/");
      return data;
    },
    staleTime: 0,
    refetchInterval: 15_000,
  });
}

function StatusBadge({ healthy, configured }: { healthy: boolean; configured: boolean }) {
  if (!configured) {
    return (
      <Badge variant="outline" className="gap-1 text-muted-foreground border-muted-foreground/40">
        <AlertTriangle className="w-3 h-3" />
        Not configured
      </Badge>
    );
  }
  if (healthy) {
    return (
      <Badge className="gap-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/15">
        <CheckCircle2 className="w-3 h-3" />
        Healthy
      </Badge>
    );
  }
  return (
    <Badge className="gap-1 bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30 hover:bg-red-500/15">
      <XCircle className="w-3 h-3" />
      Cooldown
    </Badge>
  );
}

function SuccessBar({ rate }: { rate: number }) {
  const pct = Math.round(rate * 100);
  const color =
    pct >= 90 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono tabular-nums text-muted-foreground w-10 text-right">
        {pct}%
      </span>
    </div>
  );
}

function ProviderCard({ provider, index }: { provider: AiProviderHealth; index: number }) {
  const meta = PROVIDER_META[provider.provider] ?? {
    label: provider.provider,
    color: "bg-gray-500",
    description: "",
  };

  const isFirst = index === 0;
  const borderClass = !provider.configured
    ? "border-muted"
    : provider.healthy
    ? "border-emerald-500/30"
    : "border-red-500/30";

  return (
    <Card className={`border ${borderClass} transition-colors relative overflow-hidden`}>
      {isFirst && provider.configured && provider.healthy && (
        <div className="absolute top-0 right-0">
          <div className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-bl-md">
            PRIMARY
          </div>
        </div>
      )}
      {!isFirst && provider.configured && (
        <div className="absolute top-0 right-0">
          <div className="bg-muted text-muted-foreground text-[10px] font-semibold px-2 py-0.5 rounded-bl-md">
            FALLBACK {index}
          </div>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${meta.color}`} />
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold">{meta.label}</CardTitle>
            <CardDescription className="text-xs mt-0.5">{meta.description}</CardDescription>
          </div>
        </div>
        <div className="mt-2">
          <StatusBadge healthy={provider.healthy} configured={provider.configured} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-0.5">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <BarChart2 className="w-3 h-3" /> Requests
            </p>
            <p className="text-xl font-bold tabular-nums">
              {provider.configured ? provider.total_requests.toLocaleString() : "—"}
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Clock className="w-3 h-3" /> Avg latency
            </p>
            <p className="text-xl font-bold tabular-nums">
              {provider.configured && provider.avg_latency_ms > 0
                ? `${Math.round(provider.avg_latency_ms)}ms`
                : "—"}
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            Success rate
          </p>
          {provider.configured ? (
            <SuccessBar rate={provider.success_rate} />
          ) : (
            <p className="text-xs text-muted-foreground">No key configured</p>
          )}
        </div>

        {provider.consecutive_failures > 0 && (
          <div className="flex items-center gap-2 rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">
            <XCircle className="w-3.5 h-3.5 shrink-0" />
            {provider.consecutive_failures} consecutive failure
            {provider.consecutive_failures !== 1 ? "s" : ""}
            {!provider.healthy && " — in 5-min cooldown"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FallbackChain({ providers }: { providers: AiProviderHealth[] }) {
  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Layers className="w-4 h-4 text-muted-foreground" />
          Fallback chain
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 flex-wrap">
          {providers.map((p, i) => {
            const meta = PROVIDER_META[p.provider];
            const available = p.configured && p.healthy;
            return (
              <div key={p.provider} className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${
                    available
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                      : "bg-muted text-muted-foreground border-border line-through"
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${meta?.color ?? "bg-gray-400"}`} />
                  {meta?.label ?? p.provider}
                </div>
                {i < providers.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                )}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Requests route left-to-right. A provider is skipped after 3 consecutive failures
          and re-tried after a 5-minute cooldown.
        </p>
      </CardContent>
    </Card>
  );
}

function OverallStatusBanner({
  status,
  configuredCount,
  availableCount,
}: {
  status: AiHealthReport["status"];
  configuredCount: number;
  availableCount: number;
}) {
  const configs: Record<
    AiHealthReport["status"],
    { icon: React.ReactNode; label: string; classes: string }
  > = {
    operational: {
      icon: <CheckCircle2 className="w-5 h-5" />,
      label: `All systems operational — ${availableCount} of ${configuredCount} providers healthy`,
      classes: "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400",
    },
    degraded: {
      icon: <AlertTriangle className="w-5 h-5" />,
      label: `Degraded — ${availableCount} of ${configuredCount} providers healthy`,
      classes: "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400",
    },
    unconfigured: {
      icon: <XCircle className="w-5 h-5" />,
      label: "No AI providers configured — add at least one API key",
      classes: "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400",
    },
  };

  const c = configs[status];
  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${c.classes}`}>
      {c.icon}
      <span className="text-sm font-medium">{c.label}</span>
    </div>
  );
}

export default function AiHealthDashboard() {
  const { user } = useAuth();
  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useAiHealthDashboard();

  if (!user?.is_staff) return <Redirect to="/dashboard" />;

  const report = data as AiHealthReport | undefined;
  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString()
    : null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            AI Provider Health
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time status of the Gemini → Groq → OpenRouter fallback chain
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">Updated {lastUpdated}</span>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
          </div>
        </div>
      ) : report ? (
        <>
          <OverallStatusBanner
            status={report.status}
            configuredCount={report.configured_count}
            availableCount={report.available_count}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {report.providers.map((p, i) => (
              <ProviderCard key={p.provider} provider={p} index={i} />
            ))}
          </div>

          <FallbackChain providers={report.providers} />

          <div className="grid grid-cols-3 gap-4">
            <Card className="border-border">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Zap className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">Configured</span>
                </div>
                <p className="text-3xl font-bold tabular-nums">{report.configured_count}</p>
                <p className="text-xs text-muted-foreground mt-0.5">of 3 providers</p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">Healthy</span>
                </div>
                <p className="text-3xl font-bold tabular-nums">{report.available_count}</p>
                <p className="text-xs text-muted-foreground mt-0.5">providers active</p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <BarChart2 className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">Total reqs</span>
                </div>
                <p className="text-3xl font-bold tabular-nums">
                  {report.providers
                    .reduce((s, p) => s + p.total_requests, 0)
                    .toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">since last restart</p>
              </CardContent>
            </Card>
          </div>

          <p className="text-xs text-muted-foreground text-center pb-2">
            Auto-refreshes every 15 seconds
          </p>
        </>
      ) : (
        <Card className="border-destructive/40">
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            Failed to load health data. Is the backend running?
          </CardContent>
        </Card>
      )}
    </div>
  );
}
