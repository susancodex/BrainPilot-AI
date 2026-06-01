import { useListNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, getListNotificationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn, formatRelative } from "@/lib/utils";
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle2, Brain } from "lucide-react";

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  info: { icon: Info, color: "text-blue-500" },
  warning: { icon: AlertTriangle, color: "text-amber-500" },
  success: { icon: CheckCircle2, color: "text-emerald-500" },
  quiz: { icon: Brain, color: "text-violet-500" },
};

export default function NotificationsPage() {
  const qc = useQueryClient();
  const { data: notifications, isLoading } = useListNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const unread = (notifications ?? []).filter(n => !n.read).length;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{unread} unread</p>
        </div>
        {unread > 0 && (
          <button
            onClick={() => markAll.mutate(undefined, { onSuccess: () => qc.invalidateQueries({ queryKey: getListNotificationsQueryKey() }) })}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
            data-testid="button-mark-all-read"
          >
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-xl animate-pulse bg-muted" />)}</div>
      ) : (notifications ?? []).length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">All caught up</p>
          <p className="text-sm mt-1">No notifications to show</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(notifications ?? []).map(notif => {
            const { icon: Icon, color } = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.info;
            return (
              <div
                key={notif.id}
                onClick={() => !notif.read && markRead.mutate({ id: notif.id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getListNotificationsQueryKey() }) })}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer",
                  notif.read ? "bg-background border-border opacity-60 hover:opacity-80" : "bg-card border-border hover:border-primary/30 hover:shadow-sm"
                )}
                data-testid={`notification-${notif.id}`}
              >
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", notif.read ? "bg-muted" : "bg-primary/10")}>
                  <Icon className={cn("w-4 h-4", notif.read ? "text-muted-foreground" : color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium", notif.read ? "text-muted-foreground" : "text-foreground")}>{notif.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{formatRelative(notif.createdAt)}</p>
                </div>
                {!notif.read && <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
