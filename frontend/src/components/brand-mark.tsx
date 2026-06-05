import { BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandMarkProps {
  className?: string;
  subtitle?: string;
  compact?: boolean;
}

export function BrandMark({ className, subtitle, compact }: BrandMarkProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground",
          compact ? "h-8 w-8" : "h-10 w-10"
        )}
      >
        <BrainCircuit className={compact ? "h-4 w-4" : "h-5 w-5"} />
      </div>
      <div className="min-w-0">
        <p className={cn("font-semibold tracking-tight text-foreground", compact ? "text-sm" : "text-base")}>
          BrainPilot
        </p>
        {subtitle ? (
          <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
