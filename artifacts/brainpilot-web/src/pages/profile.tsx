import { useAuth, useChangePassword } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

export default function Profile() {
  const { user, updateProfile, logout } = useAuth();
  const changePassword = useChangePassword();
  const { toast } = useToast();

  const [profileData, setProfileData] = useState({
    name: "", bio: "", phone: "", timezone: "", institution: "", 
    field_of_study: "", academic_level: "", study_goal_hours_per_week: 0, preferred_study_time: ""
  });

  const [pwdData, setPwdData] = useState({ current_password: "", new_password: "" });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        bio: user.profile?.bio || "",
        phone: user.profile?.phone || "",
        timezone: user.profile?.timezone || "UTC",
        institution: user.profile?.institution || "",
        field_of_study: user.profile?.field_of_study || "",
        academic_level: user.profile?.academic_level || "undergraduate",
        study_goal_hours_per_week: user.profile?.study_goal_hours_per_week || 10,
        preferred_study_time: user.profile?.preferred_study_time || "morning"
      });
    }
  }, [user]);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate({ name: profileData.name, profile: profileData }, {
      onSuccess: () => toast({ title: "Profile updated successfully." })
    });
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    changePassword.mutate(pwdData, {
      onSuccess: () => {
        toast({ title: "Password changed successfully." });
        setPwdData({ current_password: "", new_password: "" });
      },
      onError: () => toast({ title: "Failed to change password.", variant: "destructive" })
    });
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Profile Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your academic profile and preferences.</p>
      </div>

      <div className="flex items-center gap-6 mb-8 p-6 bg-card rounded-xl border border-border shadow-sm">
        <Avatar className="h-24 w-24 border-4 border-background shadow-sm">
          <AvatarFallback className="text-3xl bg-primary text-primary-foreground font-bold">
            {user?.name?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-bold text-2xl tracking-tight">{user?.name || "User"}</h3>
          <p className="text-muted-foreground bg-muted w-fit px-3 py-1 rounded-full text-sm mt-2">{user?.email}</p>
        </div>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle>Academic Profile</CardTitle>
          <CardDescription>Tell the AI about your studies to get better recommendations.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Institution</Label>
                <Input value={profileData.institution} onChange={e => setProfileData({...profileData, institution: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Field of Study</Label>
                <Input value={profileData.field_of_study} onChange={e => setProfileData({...profileData, field_of_study: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Academic Level</Label>
                <Select value={profileData.academic_level} onValueChange={v => setProfileData({...profileData, academic_level: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high_school">High School</SelectItem>
                    <SelectItem value="undergraduate">Undergraduate</SelectItem>
                    <SelectItem value="postgraduate">Postgraduate</SelectItem>
                    <SelectItem value="doctorate">Doctorate</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Weekly Study Goal (Hours)</Label>
                <Input type="number" min={1} value={profileData.study_goal_hours_per_week} onChange={e => setProfileData({...profileData, study_goal_hours_per_week: parseInt(e.target.value) || 0})} />
              </div>
              <div className="space-y-2">
                <Label>Preferred Study Time</Label>
                <Select value={profileData.preferred_study_time} onValueChange={v => setProfileData({...profileData, preferred_study_time: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="afternoon">Afternoon</SelectItem>
                    <SelectItem value="evening">Evening</SelectItem>
                    <SelectItem value="night">Night</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Bio / Study Goals</Label>
              <Textarea value={profileData.bio} onChange={e => setProfileData({...profileData, bio: e.target.value})} rows={3} />
            </div>
            <Button type="submit" disabled={updateProfile.isPending}>Save Profile</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your account security.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-sm">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input type="password" value={pwdData.current_password} onChange={e => setPwdData({...pwdData, current_password: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" value={pwdData.new_password} onChange={e => setPwdData({...pwdData, new_password: e.target.value})} required />
            </div>
            <Button type="submit" variant="secondary" disabled={changePassword.isPending}>Update Password</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive/20 bg-destructive/5">
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
