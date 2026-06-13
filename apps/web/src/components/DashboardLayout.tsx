import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, LogOut, LayoutDashboard, Trello, Briefcase, Calendar, BarChart3, UserCircle, Smartphone } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DashboardLayoutProps {
  activeTab: "dashboard" | "kanban" | "placements" | "calendar" | "analytics" | "profile";
  children: React.ReactNode;
}

export default function DashboardLayout({ activeTab, children }: DashboardLayoutProps) {
  const { user, loading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const { isInstallable, isIOS, triggerInstall } = usePWAInstall();

  const handleConfirmInstall = async () => {
    setShowInstallDialog(false);
    try {
      const outcome = await triggerInstall();
      if (outcome === "accepted") {
        toast.success("App installed successfully.");
      } else {
        toast.info("Installation cancelled.");
      }
    } catch (error) {
      toast.error("Failed to trigger installation.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-main">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!loading && !user) {
    setLocation("/login");
    return null;
  }

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard?view=dashboard" },
    { id: "kanban", label: "Applications", icon: Trello, path: "/dashboard?view=kanban" },
    { id: "placements", label: "Placements", icon: Briefcase, path: "/placements" },
    { id: "calendar", label: "Schedule", icon: Calendar, path: "/dashboard?view=calendar" },
    { id: "analytics", label: "Insights", icon: BarChart3, path: "/dashboard?view=analytics" },
    { id: "profile", label: "Settings", icon: UserCircle, path: "/dashboard?view=profile" },
  ] as const;

  const handleTabClick = (path: string) => {
    setLocation(path);
  };

  return (
    <div className="min-h-screen bg-bg-main text-text-main pb-20 md:pb-0 font-sans selection:bg-primary/30">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/5 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-bg-main/80 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-base font-bold text-white">📋</span>
            </div>
            <h1 className="text-lg font-bold tracking-tight hidden sm:block">EventTracker</h1>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center outline-none">
                  <Avatar className="h-8 w-8 border border-border cursor-pointer hover:border-primary/50 transition-all">
                    <AvatarFallback className="text-xs font-black bg-bg-elevated text-primary">
                      {user?.email?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2 bg-bg-card border-border text-text-main">
                <div className="flex flex-col p-3 border-b border-border">
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Identity</p>
                  <p className="text-sm font-bold truncate text-text-main">{user?.email}</p>
                </div>
                <div className="p-1">
                  <DropdownMenuItem onClick={() => setLocation("/dashboard?view=profile")} className="cursor-pointer hover:bg-bg-elevated rounded-md px-3 py-2 text-sm font-bold">
                    Profile Settings
                  </DropdownMenuItem>
                </div>
                <DropdownMenuSeparator className="bg-border" />
                <div className="p-1">
                  <DropdownMenuItem
                    onClick={logout}
                    className="cursor-pointer text-danger hover:bg-danger/10 rounded-md px-3 py-2 text-sm font-bold"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {isInstallable && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowInstallDialog(true)}
                      className="h-8 w-8 text-text-muted hover:text-text-main hover:bg-bg-elevated/40 rounded-xl border border-border/60 transition-colors"
                    >
                      <Smartphone className="w-4.5 h-4.5 text-primary" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-bg-card border-border text-text-main font-bold text-xs">
                    Install App
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="sticky top-16 z-40 border-b border-border bg-bg-main/60 backdrop-blur-md hidden md:block">
        <div className="container flex gap-1 h-14">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.path)}
                className={cn(
                  "relative flex items-center gap-2.5 px-6 py-3 text-sm font-black uppercase tracking-tight transition-all duration-300",
                  isActive
                     ? "text-primary"
                     : "text-text-muted hover:text-text-main hover:bg-bg-card/50"
                )}
              >
                <Icon className={cn("w-4 h-4 transition-transform", isActive && "scale-110")} />
                {tab.label}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_12px_rgba(249,115,22,0.6)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <main className="container py-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-bg-card/95 backdrop-blur-2xl border-t border-border">
        <div className="grid grid-cols-6 h-16">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.path)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 transition-all duration-300",
                  isActive ? "text-primary bg-primary/5" : "text-text-muted"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]")} />
                <span className="text-[9px] font-black uppercase tracking-tighter">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent className="max-w-md bg-bg-card border-border text-text-main rounded-2xl shadow-2xl p-6">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-black">
              {isIOS ? "Install EventTracker on iOS" : "Install Opportunity Management Platform?"}
            </DialogTitle>
            <DialogDescription className="text-sm text-text-muted">
              {isIOS 
                ? "Install this app on your iPhone or iPad for faster access and a native app experience."
                : "Install this app on your device for faster access and a better experience."}
            </DialogDescription>
          </DialogHeader>
          
          {isIOS ? (
            <div className="space-y-4 py-4 text-sm text-text-main">
              <p className="font-bold mb-2 text-primary">Follow these simple steps in Safari:</p>
              <ol className="list-decimal list-inside space-y-3 font-semibold">
                <li>
                  Tap the <span className="inline-flex items-center px-2 py-0.5 rounded bg-bg-elevated border border-border text-xs"><span className="text-base mr-1">📤</span> Share</span> button.
                </li>
                <li>
                  Scroll down and tap <span className="inline-flex items-center px-2 py-0.5 rounded bg-bg-elevated border border-border text-xs"><span className="text-base mr-1">➕</span> Add to Home Screen</span>.
                </li>
                <li>
                  Tap <span className="font-bold text-primary">Add</span> in the top-right corner.
                </li>
              </ol>
            </div>
          ) : null}

          <DialogFooter className="flex justify-end gap-3 pt-4 border-t border-border/40 mt-6 font-bold">
            <Button
              type="button"
              variant={isIOS ? "default" : "ghost"}
              onClick={() => setShowInstallDialog(false)}
              className={cn(
                "font-black px-6 h-10 shadow-lg",
                isIOS 
                  ? "bg-primary hover:bg-primary-hover text-white shadow-primary/20" 
                  : "text-text-muted hover:text-text-main hover:bg-bg-hover"
              )}
            >
              {isIOS ? "Got it" : "Cancel"}
            </Button>
            {!isIOS && (
              <Button
                type="button"
                onClick={handleConfirmInstall}
                className="bg-primary hover:bg-primary-hover text-white font-black px-6 h-10 shadow-lg shadow-primary/20"
              >
                Install
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
