import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-primary/10", className)}
      {...props}
    />
  )
}

interface CardSkeletonProps {
  className?: string;
  showAvatar?: boolean;
  showTitle?: boolean;
  showContent?: boolean;
}

export function CardSkeleton({ 
  className, 
  showAvatar = true, 
  showTitle = true, 
  showContent = true 
}: CardSkeletonProps) {
  return (
    <div className={cn("p-4 space-y-4", className)}>
      {showAvatar && (
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-3 w-[150px]" />
          </div>
        </div>
      )}
      {showTitle && <Skeleton className="h-6 w-3/4" />}
      {showContent && (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      )}
    </div>
  )
}

interface ListSkeletonProps {
  className?: string;
  count?: number;
}

export function ListSkeleton({ className, count = 5 }: ListSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-md" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export { Skeleton }
