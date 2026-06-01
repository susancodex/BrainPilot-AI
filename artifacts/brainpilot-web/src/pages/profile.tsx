import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Mail } from "lucide-react";

export default function Profile() {
  const { user, updateProfile, logout } = useAuth();

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    // Implementation for profile update
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Profile Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences.</p>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your personal details here.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 mb-8">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{user?.name || "User"}</h3>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input defaultValue={user?.name} />
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input type="email" defaultValue={user?.email} disabled className="bg-muted/50" />
              <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
            </div>
            <Button type="submit" disabled={updateProfile.isPending}>
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-medium">Sign Out</h4>
              <p className="text-sm text-muted-foreground">Log out of this device.</p>
            </div>
            <Button variant="destructive" onClick={() => logout.mutate()}>
              Sign out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
