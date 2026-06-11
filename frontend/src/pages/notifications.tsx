import {
  useNotifications, useMarkNotificationRead,
  useMarkAllNotificationsRead, useDeleteNotification, useClearAllNotifications,
} from "@/hooks/use-notifications";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Bell, Check, BookOpen, Target, BrainCircuit, AlertCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Notification, NotificationsResponse } from "@/types";

export default function Notifications() {
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotif = useDeleteNotification();
  const clearAll = useClearAllNotifications();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "revision_due": return <BookOpen className="w-4 h-4 text-blue-500" />;
      case "goal_reminder": return <Target className="w-4 h-4 text-green-500" />;
      case "ai_recommendation": return <BrainCircuit className="w-4 h-4 text-purple-500" />;
      case "exam_alert": return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Bell className="w-4 h-4 text-primary" />;
    }
  };

  const getBadgeClass = (type: Notification["type"]) => {
    switch (type) {
      case "revision_due": return "bg-blue-500/10 text-blue-500";
      case "goal_reminder": return "bg-green-500/10 text-green-500";
      case "ai_recommendation": return "bg-purple-500/10 text-purple-500";
      case "exam_alert": return "bg-red-500/10 text-red-500";
      default: return "bg-primary/10 text-primary";
    }
  };

  const notifData = notifications as NotificationsResponse | undefined;
  const notifList = notifData?.notifications ?? [];
  const hasUnread = notifList.some((n) => !n.is_read);

  const handleNotificationClick = (notif: Notification) => {
    if (!notif.is_read) markRead.mutate(notif.id);
    if (notif.action_url) {
      if (notif.action_url.startsWith("/")) {
        navigate(notif.action_url);
      } else {
        window.location.href = notif.action_url;
      }
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteNotif.mutate(id, {
      onSuccess: () => toast({ title: "Notification dismissed" }),
    });
  };

  const handleClearAll = () => {
    clearAll.mutate(undefined, {
      onSuccess: () => {
        setClearConfirmOpen(false);
        toast({ title: "All notifications cleared" });
      },
    });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Notifications</h1>
          <p className="text-muted-foreground mt-1">Updates and reminders from your AI tutor.</p>
        </div>
        <div className="flex items-center gap-2">
          {hasUnread && (
            <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
              <Check className="w-4 h-4 mr-2" /> Mark all read
            </Button>
          )}
          {notifList.length > 0 && (
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30" onClick={() => setClearConfirmOpen(true)}>
              <Trash2 className="w-4 h-4 mr-2" /> Clear all
            </Button>
          )}
        </div>
      </div>

      <AlertDialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Notifications?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete all {notifList.length} notification{notifList.length !== 1 ? "s" : ""}.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {clearAll.isPending ? "Clearing..." : "Clear All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-3">
        {isLoading ? (
          <div className="text-muted-foreground">Loading notifications...</div>
        ) : notifList.length ? (
          notifList.map((notif) => (
            <Card
              key={notif.id}
              className={cn(
                "border-border shadow-sm transition-colors cursor-pointer hover:border-primary/30",
                !notif.is_read ? "bg-accent/5 border-accent/20" : "bg-card"
              )}
              onClick={() => handleNotificationClick(notif)}
            >
              <CardContent className="p-4 flex gap-4 items-start">
                <div className={cn("p-2 rounded-full shrink-0", getBadgeClass(notif.type))}>
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
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
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={(e) => handleDelete(e, notif.id)}
                  disabled={deleteNotif.isPending}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
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
