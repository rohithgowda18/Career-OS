import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import ApplicationProfileForm from "./ApplicationProfileForm";

interface SettingsPageProps {
  onBack: () => void;
}

export default function SettingsPage({ onBack }: SettingsPageProps) {
  const preferencesQuery = trpc.preferences.get.useQuery();
  const preferences = preferencesQuery.data;

  const [defaultView, setDefaultView] = useState<"dashboard" | "kanban" | "list" | "calendar" | "analytics">("dashboard");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);
  const [emailDeadlineReminders, setEmailDeadlineReminders] = useState(true);
  const [emailStatusUpdates, setEmailStatusUpdates] = useState(true);
  const [weeklyDigestEnabled, setWeeklyDigestEnabled] = useState(true);
  const [digestDay, setDigestDay] = useState("Monday");

  // Sync state after preferences load
  useEffect(() => {
    if (preferences) {
      setDefaultView(preferences.defaultView || "dashboard");
      setNotificationsEnabled(preferences.notificationsEnabled === 1);
      setEmailNotificationsEnabled(preferences.emailNotificationsEnabled === 1);
      setEmailDeadlineReminders(preferences.emailDeadlineReminders === 1);
      setEmailStatusUpdates(preferences.emailStatusUpdates === 1);
      setWeeklyDigestEnabled((preferences as any).weeklyDigestEnabled === 1);
      setDigestDay((preferences as any).digestDay || "Monday");
    }
  }, [preferences]);

  const updateMutation = trpc.preferences.update.useMutation({
    onSuccess: () => {
      toast.success("Settings saved successfully");
    },
    onError: () => {
      toast.error("Failed to save settings");
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      defaultView: defaultView as any,
      notificationsEnabled,
      emailNotificationsEnabled,
      emailDeadlineReminders,
      emailStatusUpdates,
      weeklyDigestEnabled,
      digestDay,
    } as any);
  };

  const hasChanges =
    (preferences && defaultView !== (preferences.defaultView || "dashboard")) ||
    (preferences && notificationsEnabled !== (preferences.notificationsEnabled === 1)) ||
    (preferences && emailNotificationsEnabled !== (preferences.emailNotificationsEnabled === 1)) ||
    (preferences && emailDeadlineReminders !== (preferences.emailDeadlineReminders === 1)) ||
    (preferences && emailStatusUpdates !== (preferences.emailStatusUpdates === 1)) ||
    (preferences && weeklyDigestEnabled !== ((preferences as any).weeklyDigestEnabled === 1)) ||
    (preferences && digestDay !== ((preferences as any).digestDay || "Monday"));

  if (preferencesQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (preferencesQuery.isError) {
    return (
      <div className="max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        </div>
        <div className="card-elevated p-8 text-center">
          <p className="text-destructive">Failed to load preferences</p>
          <Button onClick={onBack} className="mt-4">Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
      </div>

      <div className="card-elevated p-8 space-y-8">
        {/* Default View Setting */}
        <div className="space-y-3">
          <Label htmlFor="defaultView" className="text-base font-semibold">
            Default View
          </Label>
          <p className="text-sm text-muted-foreground">
            Choose which view you want to see when you open the app
          </p>
          <Select value={defaultView} onValueChange={(value) => setDefaultView(value as "dashboard" | "kanban" | "list" | "calendar")}>
            <SelectTrigger id="defaultView" className="w-full md:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dashboard">Dashboard</SelectItem>
              <SelectItem value="kanban">Kanban Board</SelectItem>
              <SelectItem value="list">List View</SelectItem>
              <SelectItem value="calendar">Calendar View</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="border-t border-border" />

        {/* In-App Notifications */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-base font-semibold">
              In-App Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive in-app notifications for updates
            </p>
          </div>
          <Switch
            checked={notificationsEnabled}
            onCheckedChange={setNotificationsEnabled}
          />
        </div>

        <div className="border-t border-border" />

        {/* Email Notifications */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base font-semibold">
                Email Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive email notifications for important events
              </p>
            </div>
            <Switch
              checked={emailNotificationsEnabled}
              onCheckedChange={setEmailNotificationsEnabled}
            />
          </div>

          {emailNotificationsEnabled && (
            <div className="space-y-4 pl-6 border-l-2 border-border">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  Deadline Reminders
                </Label>
                <Switch
                  checked={emailDeadlineReminders}
                  onCheckedChange={setEmailDeadlineReminders}
                />
              </div>
              <p className="text-xs text-muted-foreground -mt-2">
                Get notified about upcoming application deadlines
              </p>

              <div className="flex items-center justify-between pt-2">
                <Label className="text-sm font-medium">
                  Status Updates
                </Label>
                <Switch
                  checked={emailStatusUpdates}
                  onCheckedChange={setEmailStatusUpdates}
                />
              </div>
              <p className="text-xs text-muted-foreground -mt-2">
                Get notified when your application status changes
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-border" />

        {/* Weekly Digest */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base font-semibold">
                Weekly Digest Email
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive a weekly summary of your applications
              </p>
            </div>
            <Switch
              checked={weeklyDigestEnabled}
              onCheckedChange={setWeeklyDigestEnabled}
            />
          </div>

          {weeklyDigestEnabled && (
            <div className="space-y-3 pl-6 border-l-2 border-border">
              <Label htmlFor="digestDay" className="text-sm font-medium">
                Delivery Day
              </Label>
              <Select value={digestDay} onValueChange={setDigestDay}>
                <SelectTrigger id="digestDay" className="w-full md:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monday">Monday</SelectItem>
                  <SelectItem value="Tuesday">Tuesday</SelectItem>
                  <SelectItem value="Wednesday">Wednesday</SelectItem>
                  <SelectItem value="Thursday">Thursday</SelectItem>
                  <SelectItem value="Friday">Friday</SelectItem>
                  <SelectItem value="Saturday">Saturday</SelectItem>
                  <SelectItem value="Sunday">Sunday</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Your digest will be sent every {digestDay} at 8:00 AM
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-border" />

        {/* Calendar Export */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">
            Calendar Export
          </Label>
          <p className="text-sm text-muted-foreground">
            Export your application deadlines to Google Calendar, Outlook, or Apple Calendar
          </p>
          <Button
            variant="outline"
            className="w-full md:w-auto"
            onClick={() => {
              // The export functionality is available in the Calendar view
              toast.info("Go to the Calendar view to export your deadlines");
            }}
          >
            Export Calendar
          </Button>
        </div>

        <div className="border-t border-border" />

        {/* Application Profile */}
        <ApplicationProfileForm />

        <div className="border-t border-border" />

        {/* Save Button */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || updateMutation.isPending}
          >
            {updateMutation.isPending && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-8 p-6 rounded-lg border border-border bg-background/50">
        <h3 className="font-semibold text-foreground mb-2">Email Notifications</h3>
        <p className="text-sm text-muted-foreground">
          Enable email notifications to receive timely updates about your applications. You'll get notified when deadlines are approaching and when your application status changes.
        </p>
      </div>
    </div>
  );
}
