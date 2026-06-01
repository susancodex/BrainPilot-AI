import { useTheme } from "@/lib/theme";
import { Moon, Sun, User, Bell, Shield, CreditCard, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account and preferences</p>
      </div>

      <div className="space-y-4">
        {/* Profile */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Profile</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">S</div>
              <div>
                <p className="font-medium text-foreground">Student User</p>
                <p className="text-sm text-muted-foreground">student@example.com</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Display name</label>
                <input defaultValue="Student User" className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" data-testid="input-display-name" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Institution</label>
                <input placeholder="Your university or school..." className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" data-testid="input-institution" />
              </div>
            </div>
            <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity" data-testid="button-save-profile">
              Save changes
            </button>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Monitor className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Appearance</h2>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground mb-3">Theme</p>
            <div className="grid grid-cols-2 gap-3 max-w-xs">
              {(["light", "dark"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={cn("flex items-center gap-2.5 p-3 rounded-xl border transition-all text-sm font-medium", theme === t ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground hover:border-border/80")}
                  data-testid={`theme-${t}`}
                >
                  {t === "light" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Notifications</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: "Daily study reminders", desc: "Get reminded to study at your preferred time" },
              { label: "Revision due alerts", desc: "Know when topics are due for review" },
              { label: "Goal progress updates", desc: "Weekly summaries of goal progress" },
              { label: "Quiz completion reports", desc: "Detailed analytics after each quiz" },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-primary transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm" />
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Security</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Current password</label>
              <input type="password" className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring max-w-xs" placeholder="••••••••" data-testid="input-current-password" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">New password</label>
              <input type="password" className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring max-w-xs" placeholder="Min. 8 characters" data-testid="input-new-password" />
            </div>
            <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity" data-testid="button-change-password">Change password</button>
          </div>
        </div>

        {/* Subscription */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Subscription</h2>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20">
            <div>
              <p className="font-semibold text-foreground">Free Plan</p>
              <p className="text-xs text-muted-foreground mt-0.5">5 AI chats/day · 3 flashcard decks · 2 quizzes/month</p>
            </div>
            <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity" data-testid="button-upgrade">
              Upgrade to Pro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
