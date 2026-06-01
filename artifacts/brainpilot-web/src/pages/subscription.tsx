import { useSubscription, usePlans } from "@/hooks/use-subscriptions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { PlanInfo } from "@/types";
import {
  CreditCard, Zap, Shield, CheckCircle2, Star, Crown,
  BarChart2, FileText, Brain, Sparkles,
} from "lucide-react";

const PLAN_ICONS: Record<string, React.ReactNode> = {
  free: <Zap className="h-5 w-5" />,
  premium: <Star className="h-5 w-5" />,
  enterprise: <Crown className="h-5 w-5" />,
};

const PLAN_COLORS: Record<string, string> = {
  free: "border-border bg-card",
  premium: "border-primary bg-primary/5",
  enterprise: "border-amber-500 bg-amber-50/30 dark:bg-amber-900/10",
};

const PLAN_BADGE: Record<string, string> = {
  free: "secondary",
  premium: "default",
  enterprise: "outline",
};

function UsageMeter({
  label,
  used,
  limit,
  icon,
}: {
  label: string;
  used: number;
  limit: number;
  icon: React.ReactNode;
}) {
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const isHigh = pct >= 80;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          {label}
        </div>
        <span className={cn("font-medium tabular-nums", isHigh ? "text-red-500" : "text-foreground")}>
          {used.toLocaleString()} / {limit === 99999 ? "∞" : limit.toLocaleString()}
        </span>
      </div>
      <Progress
        value={limit === 99999 ? 5 : pct}
        className={cn("h-2", isHigh && "[&>div]:bg-red-500")}
      />
    </div>
  );
}

function PlanCard({
  plan,
  isCurrentPlan,
}: {
  plan: PlanInfo;
  isCurrentPlan: boolean;
}) {
  const key = plan.plan_key;
  return (
    <Card
      className={cn(
        "relative transition-all",
        PLAN_COLORS[key] || "border-border bg-card",
        isCurrentPlan && "ring-2 ring-primary/40"
      )}
    >
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="shadow-md">Current Plan</Badge>
        </div>
      )}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "p-2 rounded-lg",
                key === "free"
                  ? "bg-muted text-muted-foreground"
                  : key === "premium"
                  ? "bg-primary/10 text-primary"
                  : "bg-amber-100 dark:bg-amber-900/30 text-amber-600"
              )}
            >
              {PLAN_ICONS[key]}
            </div>
            <CardTitle className="text-lg">{plan.name}</CardTitle>
          </div>
        </div>
        <div className="mt-3">
          {plan.price_monthly === 0 ? (
            <p className="text-3xl font-bold text-foreground">Free</p>
          ) : (
            <div>
              <span className="text-3xl font-bold text-foreground">${plan.price_monthly}</span>
              <span className="text-muted-foreground text-sm"> / month</span>
              <p className="text-xs text-muted-foreground mt-0.5">
                or ${plan.price_yearly}/year (save {Math.round((1 - plan.price_yearly / (plan.price_monthly * 12)) * 100)}%)
              </p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 mb-5">
          {plan.features.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
              <span className="text-muted-foreground">{f}</span>
            </li>
          ))}
        </ul>
        {isCurrentPlan ? (
          <Button variant="outline" className="w-full" disabled>
            Current Plan
          </Button>
        ) : key === "free" ? (
          <Button variant="outline" className="w-full" disabled>
            Downgrade
          </Button>
        ) : (
          <Button
            className={cn(
              "w-full",
              key === "enterprise" && "bg-amber-500 hover:bg-amber-600 text-white border-amber-500"
            )}
            onClick={() =>
              window.open(
                "mailto:billing@brainpilot.ai?subject=Upgrade to " + plan.name,
                "_blank"
              )
            }
          >
            {key === "premium" ? (
              <>
                <Sparkles className="h-4 w-4 mr-1.5" />
                Upgrade to Premium
              </>
            ) : (
              <>
                <Crown className="h-4 w-4 mr-1.5" />
                Contact Sales
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function Subscription() {
  const { data: subscription, isLoading: subLoading } = useSubscription();
  const { data: plans, isLoading: plansLoading } = usePlans();

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-primary" />
          Subscription & Usage
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your plan and track your AI usage.
        </p>
      </div>

      {/* Current Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-primary" />
            Current Usage
          </CardTitle>
          <CardDescription>
            {subLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              <>
                You&apos;re on the{" "}
                <Badge variant="outline" className="mx-1">
                  {subscription?.plan_display ?? "Free"}
                </Badge>
                plan
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {subLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : subscription ? (
            <>
              <UsageMeter
                label="AI Requests this month"
                used={subscription.ai_requests_used}
                limit={subscription.ai_requests_limit}
                icon={<Brain className="h-3.5 w-3.5" />}
              />
              <UsageMeter
                label="PDF Documents"
                used={subscription.pdfs_uploaded}
                limit={subscription.pdfs_limit}
                icon={<FileText className="h-3.5 w-3.5" />}
              />
              <Separator />
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-green-500" />
                  Status:{" "}
                  <Badge variant="outline" className="ml-1">
                    {subscription.status_display}
                  </Badge>
                </div>
                {subscription.expires_at && (
                  <span>
                    Renews:{" "}
                    {new Date(subscription.expires_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      {/* Plans */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Available Plans</h2>
        {plansLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-80 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(Array.isArray(plans) ? plans : []).map((plan) => (
              <PlanCard
                key={plan.plan_key}
                plan={plan}
                isCurrentPlan={subscription?.plan === plan.plan_key}
              />
            ))}
          </div>
        )}
      </div>

      {/* Trust badges */}
      <Card className="bg-muted/30">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            {[
              { icon: <Shield className="h-4 w-4 text-green-500" />, text: "Secure payments" },
              { icon: <CheckCircle2 className="h-4 w-4 text-blue-500" />, text: "Cancel anytime" },
              { icon: <Zap className="h-4 w-4 text-amber-500" />, text: "Instant activation" },
              { icon: <Star className="h-4 w-4 text-purple-500" />, text: "7-day free trial" },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-1.5">
                {icon}
                {text}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
