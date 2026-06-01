import { useNotifications } from "@/hooks/use-notifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";

export default function Notifications() {
  const { data: notifications, isLoading } = useNotifications();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Notifications</h1>
          <p className="text-muted-foreground mt-1">Updates and reminders from your AI tutor.</p>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-muted-foreground">Loading notifications...</div>
        ) : notifications?.length ? (
          notifications.map((notif: any) => (
            <Card key={notif.id} className="border-border shadow-sm">
              <CardContent className="p-4 flex gap-4">
                <div className="mt-1 bg-primary/10 p-2 rounded-full h-fit">
                  <Bell className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="font-medium text-foreground">{notif.title}</div>
                  <div className="text-sm text-muted-foreground mt-1">{notif.message}</div>
                  <div className="text-xs text-muted-foreground mt-2 opacity-70">
                    {new Date(notif.created_at).toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center p-12 border border-dashed rounded-xl text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-4 text-muted" />
            <p>You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
}
