import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/hooks/use-notifications";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Check, BookOpen, Target, BrainCircuit, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Notifications() {
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const getIcon = (type: string) => {
    switch(type) {
      case 'revision_due': return <BookOpen className="w-4 h-4 text-blue-500" />;
      case 'goal_reminder': return <Target className="w-4 h-4 text-green-500" />;
      case 'ai_recommendation': return <BrainCircuit className="w-4 h-4 text-purple-500" />;
      case 'exam_alert': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Bell className="w-4 h-4 text-primary" />;
    }
  };

  const getBadgeClass = (type: string) => {
    switch(type) {
      case 'revision_due': return 'bg-blue-500/10 text-blue-500';
      case 'goal_reminder': return 'bg-green-500/10 text-green-500';
      case 'ai_recommendation': return 'bg-purple-500/10 text-purple-500';
      case 'exam_alert': return 'bg-red-500/10 text-red-500';
      default: return 'bg-primary/10 text-primary';
    }
  };

  const hasUnread = notifications?.some((n: any) => !n.is_read);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Notifications</h1>
          <p className="text-muted-foreground mt-1">Updates and reminders from your AI tutor.</p>
        </div>
        {hasUnread && (
          <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
            <Check className="w-4 h-4 mr-2" /> Mark all read
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="text-muted-foreground">Loading notifications...</div>
        ) : notifications?.length ? (
          notifications.map((notif: any) => (
            <Card 
              key={notif.id} 
              className={cn(
                "border-border shadow-sm transition-colors cursor-pointer hover:border-primary/30",
                !notif.is_read ? "bg-accent/5 border-accent/20" : "bg-card"
              )}
              onClick={() => {
                if (!notif.is_read) markRead.mutate(notif.id);
                if (notif.action_url) window.location.href = notif.action_url;
              }}
            >
              <CardContent className="p-4 flex gap-4">
                <div className={cn("p-2 rounded-full h-fit shrink-0", getBadgeClass(notif.type))}>
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start gap-4">
                    <div className={cn("font-medium", !notif.is_read ? "text-foreground font-bold" : "text-foreground")}>
                      {notif.title}
                    </div>
                    {!notif.is_read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />}
                  </div>
                  <div className={cn("text-sm mt-1", !notif.is_read ? "text-foreground" : "text-muted-foreground")}>
                    {notif.message}
                  </div>
                  <div className="text-xs text-muted-foreground mt-3 font-medium">
                    {new Date(notif.created_at).toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center p-12 border border-dashed rounded-xl text-muted-foreground bg-card">
            <Bell className="w-12 h-12 mx-auto mb-4 text-muted" />
            <p className="text-lg font-medium text-foreground">You're all caught up!</p>
            <p>No new notifications at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
