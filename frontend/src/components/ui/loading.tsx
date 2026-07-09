import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <Loader2 className={cn("animate-spin", sizeClasses[size], className)} />
  );
}

interface LoadingPageProps {
  message?: string;
  showColdStartHint?: boolean;
}

export function LoadingPage({ 
  message = "Loading...", 
  showColdStartHint = false 
}: LoadingPageProps) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center max-w-md px-4">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-muted-foreground mb-2">{message}</p>
        {showColdStartHint && (
          <p className="text-xs text-muted-foreground/60">
            Server may be waking up from sleep. This may take up to 60 seconds.
          </p>
        )}
      </div>
    </div>
  );
}
