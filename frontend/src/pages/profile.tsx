import { useAuth, useChangePassword } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { UserAvatar, PresetAvatarPreview } from "@/components/user-avatar";
import {
  AVATAR_PRESETS,
  DEFAULT_AVATAR_PRESET,
  getUserInitials,
  type AvatarPresetId,
} from "@/lib/avatar-presets";
import { Camera, Trash2, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api-error";

export default function Profile() {
  const { user, updateProfile, uploadAvatar, removeAvatar, logout } = useAuth();
  const changePassword = useChangePassword();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedPreset, setSelectedPreset] = useState<AvatarPresetId>(DEFAULT_AVATAR_PRESET);
  const [profileData, setProfileData] = useState({
    first_name: "",
    last_name: "",
    bio: "",
    phone: "",
    timezone: "UTC",
    institution: "",
    field_of_study: "",
    academic_level: "undergraduate",
    study_goal_hours_per_week: 10,
    preferred_study_time: "morning",
  });

  const [pwdData, setPwdData] = useState({ current_password: "", new_password: "" });

  const avatarUrl = user?.profile?.avatar_url ?? null;
  const hasCustomPhoto = Boolean(avatarUrl);
  const initials = getUserInitials(user?.first_name, user?.last_name);

  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        bio: user.profile?.bio || "",
        phone: user.profile?.phone || "",
        timezone: user.profile?.timezone || "UTC",
        institution: user.profile?.institution || "",
        field_of_study: user.profile?.field_of_study || "",
        academic_level: user.profile?.academic_level || "undergraduate",
        study_goal_hours_per_week: user.profile?.study_goal_hours_per_week || 10,
        preferred_study_time: user.profile?.preferred_study_time || "morning",
      });
      const preset = (user.profile?.avatar_preset || DEFAULT_AVATAR_PRESET) as AvatarPresetId;
      setSelectedPreset(preset);
    }
  }, [user]);

  const handlePresetSelect = (presetId: AvatarPresetId) => {
    setSelectedPreset(presetId);
    updateProfile.mutate(
      { avatar_preset: presetId },
      {
        onSuccess: () => toast({ title: "Profile picture updated." }),
        onError: () =>
          toast({ title: "Could not update picture.", variant: "destructive" }),
      }
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast({
        title: "Unsupported format",
        description: "Use JPEG, PNG, or WebP.",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum size is 2 MB.",
        variant: "destructive",
      });
      return;
    }
    uploadAvatar.mutate(file, {
      onSuccess: () => toast({ title: "Photo uploaded." }),
      onError: (error) =>
        toast({
          title: "Upload failed",
          description: getApiErrorMessage(error, "Please try again."),
          variant: "destructive",
        }),
    });
    e.target.value = "";
  };

  const handleRemovePhoto = () => {
    removeAvatar.mutate(undefined, {
      onSuccess: () => {
        setSelectedPreset(DEFAULT_AVATAR_PRESET);
        toast({ title: "Photo removed. Using preset avatar." });
      },
      onError: () =>
        toast({ title: "Could not remove photo.", variant: "destructive" }),
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(profileData, {
      onSuccess: () => toast({ title: "Profile updated successfully." }),
      onError: () => toast({ title: "Failed to update profile.", variant: "destructive" }),
    });
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    changePassword.mutate(pwdData, {
      onSuccess: () => {
        toast({ title: "Password changed successfully." });
        setPwdData({ current_password: "", new_password: "" });
      },
      onError: () => toast({ title: "Failed to change password.", variant: "destructive" }),
    });
  };

  const avatarBusy = uploadAvatar.isPending || removeAvatar.isPending || updateProfile.isPending;

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-12 min-w-0">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Profile Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your photo, academic profile, and preferences.</p>
      </div>

      <Card className="border-border shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            Profile Picture
          </CardTitle>
          <CardDescription>
            Choose a color preset or upload your own photo (JPEG, PNG, or WebP, max 2 MB).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-4 sm:px-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
            <UserAvatar
              firstName={user?.first_name}
              lastName={user?.last_name}
              avatarUrl={avatarUrl}
              avatarPreset={hasCustomPhoto ? null : selectedPreset}
              cacheVersion={user?.profile?.updated_at}
              className="h-28 w-28 border-4 border-background shadow-md"
              fallbackClassName="text-3xl"
            />
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
              <Button
                type="button"
                variant="outline"
                className="gap-2 min-h-[44px] w-full sm:w-auto"
                disabled={avatarBusy}
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-4 w-4" />
                {uploadAvatar.isPending ? "Uploading…" : "Upload photo"}
              </Button>
              {hasCustomPhoto && (
                <Button
                  type="button"
                  variant="ghost"
                  className="gap-2 min-h-[44px] w-full text-destructive hover:text-destructive sm:w-auto"
                  disabled={avatarBusy}
                  onClick={handleRemovePhoto}
                >
                  <Trash2 className="h-4 w-4" />
                  Remove photo
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                aria-label="Upload profile photo"
                onChange={handleFileChange}
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-foreground mb-3">Color presets</p>
            <div
              className={cn(
                "grid grid-cols-4 gap-2 sm:grid-cols-8 sm:gap-3",
                hasCustomPhoto && "opacity-50 pointer-events-none"
              )}
            >
              {AVATAR_PRESETS.map((preset) => (
                <PresetAvatarPreview
                  key={preset.id}
                  presetId={preset.id}
                  initials={initials}
                  selected={!hasCustomPhoto && selectedPreset === preset.id}
                  onClick={() => handlePresetSelect(preset.id)}
                />
              ))}
            </div>
            {hasCustomPhoto && (
              <p className="text-xs text-muted-foreground mt-2">
                Remove your uploaded photo to switch back to a preset.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col items-center gap-4 p-4 text-center sm:flex-row sm:items-center sm:gap-6 sm:p-6 sm:text-left bg-card rounded-xl border border-border shadow-sm">
        <UserAvatar
          firstName={user?.first_name}
          lastName={user?.last_name}
          avatarUrl={avatarUrl}
          avatarPreset={hasCustomPhoto ? null : selectedPreset}
          cacheVersion={user?.profile?.updated_at}
          className="h-16 w-16 border-2 border-background shadow-sm"
          fallbackClassName="text-xl"
        />
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-xl tracking-tight sm:text-2xl">{user?.full_name || "User"}</h3>
          <p className="text-muted-foreground bg-muted w-full max-w-full break-all px-3 py-1 rounded-full text-sm mt-2 sm:w-fit">
            {user?.email}
          </p>
          {user?.role && (
            <p className="text-xs text-muted-foreground mt-1 capitalize">{user.role}</p>
          )}
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
                <Label>First Name</Label>
                <Input
                  value={profileData.first_name}
                  onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={profileData.last_name}
                  onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Institution</Label>
                <Input
                  value={profileData.institution}
                  onChange={(e) => setProfileData({ ...profileData, institution: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Field of Study</Label>
                <Input
                  value={profileData.field_of_study}
                  onChange={(e) => setProfileData({ ...profileData, field_of_study: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Academic Level</Label>
                <Select
                  value={profileData.academic_level}
                  onValueChange={(v) => setProfileData({ ...profileData, academic_level: v })}
                >
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
                <Label>Preferred Study Time</Label>
                <Select
                  value={profileData.preferred_study_time}
                  onValueChange={(v) => setProfileData({ ...profileData, preferred_study_time: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="afternoon">Afternoon</SelectItem>
                    <SelectItem value="evening">Evening</SelectItem>
                    <SelectItem value="night">Night</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Weekly Study Goal (Hours)</Label>
                <Input
                  type="number"
                  min={1}
                  value={profileData.study_goal_hours_per_week}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      study_goal_hours_per_week: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  placeholder="+1 555 000 0000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Bio / Study Goals</Label>
              <Textarea
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                rows={3}
                placeholder="Tell us about your academic goals..."
              />
            </div>
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? "Saving…" : "Save Profile"}
            </Button>
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
              <Input
                type="password"
                value={pwdData.current_password}
                onChange={(e) => setPwdData({ ...pwdData, current_password: e.target.value })}
                autoComplete="current-password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                value={pwdData.new_password}
                onChange={(e) => setPwdData({ ...pwdData, new_password: e.target.value })}
                autoComplete="new-password"
                required
              />
            </div>
            <Button type="submit" variant="secondary" disabled={changePassword.isPending}>
              {changePassword.isPending ? "Updating…" : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1 min-w-0">
              <h4 className="font-medium">Sign Out</h4>
              <p className="text-sm text-muted-foreground">Log out of this device.</p>
            </div>
            <Button variant="destructive" className="min-h-[44px] w-full sm:w-auto shrink-0" onClick={() => logout.mutate()}>
              Sign out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
