import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/contexts/ThemeContext";
import { applicationsApi } from "@/lib/api/applicationsApi";
import { placementsApi } from "@/lib/api/placementsApi";
import { 
  Loader2, 
  LogOut, 
  LayoutDashboard, 
  Layers, 
  Briefcase, 
  Calendar as CalendarIcon, 
  UserCircle, 
  Smartphone, 
  Search, 
  Terminal,
  WifiOff,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Command,
  Plus,
  Palette,
  RefreshCw,
  Award,
  ListTodo
} from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import AddApplicationModal from "@/components/AddApplicationModal";
import AddPlacementModal from "@/components/AddPlacementModal";

interface DashboardLayoutProps {
  activeTab: "dashboard" | "kanban" | "placements" | "skills" | "routine" | "calendar" | "analytics" | "profile";
  children: React.ReactNode;
}

export default function DashboardLayout({ activeTab, children }: DashboardLayoutProps) {
  const { currentTheme, setTheme, themeTokens, toggleDarkMode } = useTheme();
  const { user, loading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const { isInstallable, isIOS, triggerInstall, isInstalled, installPromptEvent } = usePWAInstall();
  const [isOnline, setIsOnline] = useState(typeof window !== "undefined" ? window.navigator.onLine : true);
  const [isMac, setIsMac] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMac(navigator.platform.toUpperCase().indexOf("MAC") >= 0);
    }
  }, []);

  // Global modals state
  const [showAddAppModal, setShowAddAppModal] = useState(false);
  const [showAddPlacementModal, setShowAddPlacementModal] = useState(false);

  // PWA Experience states
  const [showInstallBanner, setShowInstallBanner] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("pwa-install-banner-dismissed") !== "true";
    }
    return true;
  });

  const handleDismissInstall = () => {
    setShowInstallBanner(false);
    localStorage.setItem("pwa-install-banner-dismissed", "true");
  };

  const queryClient = useQueryClient();
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartRef = useRef(0);
  const isPullingRef = useRef(false);
  const updateSWRef = useRef<any>(null);

  // Sync PWA update events
  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      updateSWRef.current = customEvent.detail?.updateSW;
      toast.info("An app update is available. Click to reload.", {
        action: {
          label: "Update",
          onClick: () => {
            if (updateSWRef.current) {
              updateSWRef.current(true);
            } else {
              window.location.reload();
            }
          }
        },
        duration: 10000,
      });
    };

    window.addEventListener("pwa-update-available", handleUpdate);
    return () => window.removeEventListener("pwa-update-available", handleUpdate);
  }, []);

  const [checkingUpdates, setCheckingUpdates] = useState(false);

  const checkForUpdates = async () => {
    if (checkingUpdates) return;
    if (!('serviceWorker' in navigator)) {
      toast.error("PWA updates not supported on this browser.");
      return;
    }

    setCheckingUpdates(true);
    const loadingToast = toast.loading("Checking for updates...");
    
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        toast.dismiss(loadingToast);
        toast.warning("No active service worker found.");
        setCheckingUpdates(false);
        return;
      }

      let updateFound = false;
      const onUpdateFound = () => {
        updateFound = true;
      };
      window.addEventListener("pwa-update-available", onUpdateFound);

      await registration.update();

      setTimeout(() => {
        window.removeEventListener("pwa-update-available", onUpdateFound);
        toast.dismiss(loadingToast);
        setCheckingUpdates(false);
        if (!updateFound) {
          toast.success("App is already up-to-date!");
        }
      }, 2000);

    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error("Failed to check for updates.");
      setCheckingUpdates(false);
    }
  };

  // Mobile Pull-to-refresh implementation
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0 && !isRefreshing) {
        touchStartRef.current = e.touches[0].clientY;
        isPullingRef.current = true;
      } else {
        isPullingRef.current = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPullingRef.current || isRefreshing) return;
      const currentY = e.touches[0].clientY;
      const diff = currentY - touchStartRef.current;
      if (diff > 0) {
        const dist = Math.min(80, diff * 0.4);
        setPullDistance(dist);
        if (dist > 10 && e.cancelable) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = async () => {
      if (!isPullingRef.current || isRefreshing) return;
      isPullingRef.current = false;
      if (pullDistance > 50) {
        setIsRefreshing(true);
        setPullDistance(50);
        toast.info("Refreshing workspace...", { id: "pwa-refresh" });
        try {
          await queryClient.invalidateQueries();
          toast.success("Workspace updated", { id: "pwa-refresh" });
        } catch (err) {
          toast.error("Failed to refresh", { id: "pwa-refresh" });
        } finally {
          setIsRefreshing(false);
          setPullDistance(0);
        }
      } else {
        setPullDistance(0);
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [pullDistance, isRefreshing, queryClient]);

  // Command palette state
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const commandInputRef = useRef<HTMLInputElement>(null);

  // Sync online/offline state
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Fetch search items
  const applicationsQuery = useQuery({
    queryKey: ["applications", { page: 0, size: 100, sort: "deadline,asc" }],
    queryFn: () => applicationsApi.list({ page: 0, size: 100, sort: "deadline,asc" }),
    enabled: !!user && showCommandPalette,
  });

  const placementsQuery = useQuery({
    queryKey: ["placements", { page: 0, size: 100, sort: "id,desc" }],
    queryFn: () => placementsApi.list({ page: 0, size: 100, sort: "id,desc" }),
    enabled: !!user && showCommandPalette,
  });

  const applications = applicationsQuery.data?.content || [];
  const placements = placementsQuery.data?.content || [];

  // Toggle command palette on Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Reset selected index when search query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  const handleConfirmInstall = async () => {
    setShowInstallDialog(false);
    if (!isIOS && !installPromptEvent) {
      toast.info("Installation is managed by your browser. If already installed, you can open OMP from your applications. Otherwise, look for the 'Install' icon in the browser address bar.", { duration: 6000 });
      return;
    }
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
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!loading && !user) {
    setLocation("/login");
    return null;
  }

  // Unified 5-Tab Navigation structure
  const tabs = [
    { id: "dashboard", label: "Home", icon: LayoutDashboard, path: "/dashboard?view=dashboard" },
    { id: "kanban", label: "Applications", icon: Layers, path: "/dashboard?view=kanban" },
    { id: "placements", label: "Placements", icon: Briefcase, path: "/placements" },
    { id: "skills", label: "My Skills", icon: Award, path: "/dashboard?view=skills" },
    { id: "routine", label: "Daily Routine", icon: ListTodo, path: "/dashboard?view=routine" },
    { id: "calendar", label: "Calendar", icon: CalendarIcon, path: "/dashboard?view=calendar" },
    { id: "profile", label: "Profile", icon: UserCircle, path: "/dashboard?view=profile" },
  ] as const;

  const handleTabClick = (path: string) => {
    setLocation(path);
  };

  // Filter items for command palette
  const filteredApps = searchQuery
    ? applications.filter(
        (app: any) =>
          app.eventName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          app.eventType?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const filteredPlacements = searchQuery
    ? placements.filter(
        (place: any) =>
          place.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          place.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          place.location?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Default shortcuts when search query is empty
  const defaultShortcuts = [
    { label: "Go to Home", action: () => setLocation("/dashboard?view=dashboard") },
    { label: "Go to Applications", action: () => setLocation("/dashboard?view=kanban") },
    { label: "Go to Placements", action: () => setLocation("/placements") },
    { label: "Go to My Skills", action: () => setLocation("/dashboard?view=skills") },
    { label: "Go to Calendar", action: () => setLocation("/dashboard?view=calendar") },
    { label: "Go to Profile Settings", action: () => setLocation("/dashboard?view=profile") },
  ];

  // Combine items to enable keyboard navigation index
  const commandItems = searchQuery
    ? [
        ...filteredApps.map((app: any) => ({
          label: `${app.eventName} (${app.eventType})`,
          category: "Applications",
          action: () => setLocation("/dashboard?view=kanban"),
        })),
        ...filteredPlacements.map((place: any) => ({
          label: `${place.companyName} — ${place.role}`,
          category: "Placements",
          action: () => setLocation("/placements"),
        })),
      ]
    : defaultShortcuts.map((s) => ({ ...s, category: "Navigation Shortcuts" }));

  const handleCommandPaletteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, commandItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + commandItems.length) % Math.max(1, commandItems.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (commandItems[selectedIndex]) {
        commandItems[selectedIndex].action();
        setShowCommandPalette(false);
        setSearchQuery("");
      }
    }
  };

  return (
    <div className={cn("min-h-screen font-sans flex flex-col pb-28 md:pb-0 relative", themeTokens.pageBg)}>
      {/* Pull to Refresh Indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div 
          className="fixed left-1/2 -translate-x-1/2 z-50 bg-bg-card border border-border rounded-full p-2 shadow-lg flex items-center justify-center transition-all"
          style={{ 
            top: `${16 + pullDistance}px`, 
            opacity: Math.min(1, pullDistance / 50),
            transform: `translate(-50%, 0) scale(${Math.min(1, pullDistance / 40)})`
          }}
        >
          <Loader2 className={cn("w-4 h-4 text-primary", isRefreshing && "animate-spin")} style={{ transform: isRefreshing ? undefined : `rotate(${pullDistance * 5}deg)` }} />
        </div>
      )}

      {!isOnline && (
        <div className="bg-danger/10 border-b border-danger/20 text-danger text-[11px] font-semibold text-center py-1.5 w-full z-50 flex items-center justify-center gap-1.5 shrink-0 animate-in slide-in-from-top duration-300">
          <WifiOff className="w-3.5 h-3.5" />
          <span>You are currently offline.</span>
        </div>
      )}

      <div className="flex-1 flex flex-col md:flex-row min-w-0">
      {/* Desktop Left Sidebar */}
      <aside className={cn("hidden md:flex flex-col w-64 fixed inset-y-0 left-0 z-30 border-r border-border/60", themeTokens.sidebarBg)}>
        {/* Brand */}
        <div className="h-16 flex items-center gap-2.5 px-6 border-b border-border">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <Terminal className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-text-main tracking-tight text-[15px]">Career OS</span>
          
          {!isOnline && (
            <div className="ml-auto" title="Offline mode active">
              <WifiOff className="w-3.5 h-3.5 text-warning" />
            </div>
          )}
        </div>

        {/* Search Command Trigger in Sidebar */}
        <div className="px-4 py-3">
          <button 
            onClick={() => setShowCommandPalette(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-elevated/40 border border-border text-[12px] text-text-dim hover:text-text-muted hover:border-border/80 transition-all text-left"
          >
            <Search className="w-3.5 h-3.5 shrink-0" />
            <span className="flex-1 min-w-0 truncate">Search...</span>
            <kbd className="ml-auto bg-bg-card border border-border px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0 text-text-dim">
              {isMac ? "⌘K" : "Ctrl+K"}
            </kbd>
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 px-3 py-2 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer",
                  isActive
                    ? themeTokens.navActive
                    : themeTokens.navInactive
                )}
              >
                <Icon className={cn("w-4.5 h-4.5 shrink-0", isActive ? "text-primary" : "text-text-dim")} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Install Prompts & Profile at Bottom */}
        <div className="p-4 border-t border-border space-y-3.5">
          {!isInstalled && (
            <button
              onClick={() => setShowInstallDialog(true)}
              className="w-full flex items-center gap-2 px-3.5 py-2 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/15 hover:border-primary/35 text-[12px] font-medium text-primary transition-all text-left"
            >
              <Smartphone className="w-4 h-4 shrink-0" />
              <span>Install App</span>
            </button>
          )}

          <div className="flex items-center justify-between">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 outline-none cursor-pointer group text-left min-w-0 flex-1">
                  <Avatar className="h-8 w-8 border border-border group-hover:border-text-muted transition-all">
                    <AvatarFallback className="text-xs font-semibold bg-bg-elevated text-primary">
                      {user?.displayName && user.displayName.trim() !== ""
                        ? user.displayName.charAt(0).toUpperCase()
                        : user?.email?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-medium text-text-main truncate leading-none mb-0.5">
                      {user?.displayName && user.displayName.trim() !== ""
                        ? user.displayName
                        : user?.email?.split('@')[0]}
                    </p>
                    <p className="text-[10px] text-text-dim truncate leading-none">Settings</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top" className="w-52 mb-1 bg-bg-card border-border text-text-main">
                <div className="flex flex-col p-2.5 border-b border-border">
                  <p className="text-[9px] font-semibold text-text-dim uppercase tracking-wider mb-0.5">Identity</p>
                  <p className="text-xs font-medium truncate text-text-main">
                    {user?.displayName && user.displayName.trim() !== ""
                      ? `${user.displayName} (${user.email})`
                      : user?.email}
                  </p>
                </div>
                <div className="p-1">
                  <DropdownMenuItem onClick={() => setLocation("/dashboard?view=profile")} className="cursor-pointer hover:bg-bg-elevated rounded-md px-2.5 py-1.5 text-xs font-medium">
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={checkForUpdates} className="cursor-pointer hover:bg-bg-elevated rounded-md px-2.5 py-1.5 text-xs font-medium flex items-center gap-2">
                    <RefreshCw className={cn("h-3.5 w-3.5 text-text-dim", checkingUpdates && "animate-spin")} />
                    <span>Check for Updates</span>
                  </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator className="bg-border" />
                <div className="p-1">
                  <DropdownMenuItem
                    onClick={logout}
                    className="cursor-pointer text-danger hover:bg-danger/10 rounded-md px-2.5 py-1.5 text-xs font-medium"
                  >
                    <LogOut className="mr-2 h-3.5 w-3.5" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className={cn("md:hidden sticky top-0 z-40 h-14 flex items-center justify-between px-4", themeTokens.navbarBg)}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
            <Terminal className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-text-main text-[14px]">Career OS</span>
          
          {!isOnline && (
            <div className="ml-1" title="Offline mode active">
              <WifiOff className="w-3 h-3 text-warning" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowCommandPalette(true)}
            className="p-1.5 rounded-lg border border-border text-text-muted hover:text-text-main bg-bg-elevated/40"
          >
            <Search className="w-4 h-4" />
          </button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                title="Change Theme"
                className="p-1.5 rounded-lg border border-border text-text-muted hover:text-text-main bg-bg-elevated/40 cursor-pointer"
              >
                <Palette className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-bg-card border-border text-text-main mt-1">
              <div className="px-2.5 py-1.5 border-b border-border">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-dim">Choose Theme</p>
              </div>
              <div className="p-1 space-y-0.5">
                <DropdownMenuItem onClick={() => setTheme("glass")} className={cn("cursor-pointer rounded-md px-2.5 py-1.5 text-xs font-medium flex items-center justify-between", currentTheme === "glass" && "bg-primary/10 text-primary")}>
                  <span>Glass (VisionOS)</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-500 border border-white/20" />
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("cyberpunk")} className={cn("cursor-pointer rounded-md px-2.5 py-1.5 text-xs font-medium flex items-center justify-between", currentTheme === "cyberpunk" && "bg-primary/10 text-primary")}>
                  <span>Cyberpunk</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 border border-white/20" />
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("brutalist")} className={cn("cursor-pointer rounded-md px-2.5 py-1.5 text-xs font-medium flex items-center justify-between", currentTheme === "brutalist" && "bg-primary/10 text-primary")}>
                  <span>Neo Brutalist</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white/20" />
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("terminal")} className={cn("cursor-pointer rounded-md px-2.5 py-1.5 text-xs font-medium flex items-center justify-between", currentTheme === "terminal" && "bg-primary/10 text-primary")}>
                  <span>Retro Terminal</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 border border-white/20 font-mono text-[9px] flex items-center justify-center text-black">$&gt;</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("claymorphism")} className={cn("cursor-pointer rounded-md px-2.5 py-1.5 text-xs font-medium flex items-center justify-between", currentTheme === "claymorphism" && "bg-primary/10 text-primary")}>
                  <span>Claymorphism</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-400 border border-white/20" />
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-0.5 rounded-lg border border-border bg-bg-elevated/40 cursor-pointer flex items-center justify-center outline-none hover:border-border/80">
                <Avatar className="h-6 w-6 border-none">
                  <AvatarFallback className="text-[9px] font-bold bg-bg-elevated text-primary">
                    {user?.displayName && user.displayName.trim() !== ""
                      ? user.displayName.charAt(0).toUpperCase()
                      : user?.email?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-bg-card border-border text-text-main">
              <div className="p-2 border-b border-border">
                <p className="text-[11px] truncate font-medium text-text-main">
                  {user?.displayName && user.displayName.trim() !== ""
                    ? user.displayName
                    : user?.email}
                </p>
              </div>
              <div className="p-1">
                <DropdownMenuItem onClick={() => setLocation("/dashboard?view=profile")} className="cursor-pointer hover:bg-bg-elevated px-2 py-1.5 text-xs font-medium">
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={checkForUpdates} className="cursor-pointer hover:bg-bg-elevated px-2 py-1.5 text-xs font-medium flex items-center gap-2">
                  <RefreshCw className={cn("h-3.5 w-3.5 text-text-dim", checkingUpdates && "animate-spin")} />
                  <span>Check for Updates</span>
                </DropdownMenuItem>

                {!isInstalled && (
                  <DropdownMenuItem onClick={() => setShowInstallDialog(true)} className="cursor-pointer text-primary hover:bg-primary/5 px-2 py-1.5 text-xs font-medium">
                    Install App
                  </DropdownMenuItem>
                )}
              </div>
              <DropdownMenuSeparator className="bg-border" />
              <div className="p-1">
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-danger hover:bg-danger/10 px-2 py-1.5 text-xs font-medium">
                  Sign out
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {!isInstalled && (
            <button 
              onClick={() => setShowInstallDialog(true)}
              className="p-1.5 rounded-lg border border-border text-text-muted hover:text-text-main bg-bg-elevated/40 cursor-pointer"
              title="Install App"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        {/* Desktop Top command bar */}
        <header className={cn("hidden md:flex sticky top-0 z-20 h-14 items-center justify-between px-8 bg-opacity-80 backdrop-blur-md border-b border-border/60", themeTokens.navbarBg)}>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-text-dim uppercase tracking-wider">Workspace</span>
            <ChevronRight className="w-3 h-3 text-text-dim" />
            <span className="text-xs font-semibold text-text-main capitalize">{activeTab === "kanban" ? "Applications" : activeTab}</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Desktop Theme Selector Icon */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  title="Change Theme"
                  className="p-1.5 h-8 w-8 flex items-center justify-center rounded-lg border border-border text-text-muted hover:text-text-main bg-bg-elevated/40 hover:bg-bg-elevated/80 transition-all cursor-pointer"
                >
                  <Palette className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-bg-card border-border text-text-main mt-1">
                <div className="px-2.5 py-1.5 border-b border-border">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-dim">Choose Theme</p>
                </div>
                <div className="p-1 space-y-0.5">
                  <DropdownMenuItem onClick={() => setTheme("glass")} className={cn("cursor-pointer rounded-md px-2.5 py-1.5 text-xs font-medium flex items-center justify-between", currentTheme === "glass" && "bg-primary/10 text-primary")}>
                    <span>Glass (VisionOS)</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-violet-500 border border-white/20" />
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("cyberpunk")} className={cn("cursor-pointer rounded-md px-2.5 py-1.5 text-xs font-medium flex items-center justify-between", currentTheme === "cyberpunk" && "bg-primary/10 text-primary")}>
                    <span>Cyberpunk</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 border border-white/20" />
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("brutalist")} className={cn("cursor-pointer rounded-md px-2.5 py-1.5 text-xs font-medium flex items-center justify-between", currentTheme === "brutalist" && "bg-primary/10 text-primary")}>
                    <span>Neo Brutalist</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white/20" />
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("terminal")} className={cn("cursor-pointer rounded-md px-2.5 py-1.5 text-xs font-medium flex items-center justify-between", currentTheme === "terminal" && "bg-primary/10 text-primary")}>
                    <span>Retro Terminal</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 border border-white/20 font-mono text-[9px] flex items-center justify-center text-black">$&gt;</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("claymorphism")} className={cn("cursor-pointer rounded-md px-2.5 py-1.5 text-xs font-medium flex items-center justify-between", currentTheme === "claymorphism" && "bg-primary/10 text-primary")}>
                    <span>Claymorphism</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-pink-400 border border-white/20" />
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="bg-primary hover:bg-primary-hover text-white h-8 px-3 text-xs font-semibold cursor-pointer">
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 bg-bg-card border-border text-text-main mt-1">
                <DropdownMenuItem onClick={() => setShowAddAppModal(true)} className="cursor-pointer hover:bg-bg-elevated px-2.5 py-1.5 text-xs font-medium">
                  Add Application
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowAddPlacementModal(true)} className="cursor-pointer hover:bg-bg-elevated px-2.5 py-1.5 text-xs font-medium">
                  Add Placement
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 py-6 px-4 md:px-8">
          {isInstallable && showInstallBanner && (
            <div className="mb-6 bg-bg-card border border-primary/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-in fade-in duration-300 shadow-sm">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Smartphone className="w-4.5 h-4.5 text-primary" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-text-main">Install Career OS</h4>
                  <p className="text-[11px] text-text-dim mt-0.5">Run in standalone window mode, enable offline capability, and get native layout sizing.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto text-xs font-semibold">
                <button 
                  onClick={handleDismissInstall} 
                  className="px-3 h-8 rounded-lg hover:bg-bg-elevated/40 text-text-dim hover:text-text-main transition-all"
                >
                  Dismiss
                </button>
                <Button 
                  onClick={() => setShowInstallDialog(true)} 
                  className="bg-primary hover:bg-primary-hover text-white px-3 h-8 rounded-lg"
                >
                  Install
                </Button>
              </div>
            </div>
          )}
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className={cn("md:hidden fixed bottom-4 left-4 right-4 z-50 backdrop-blur-lg border border-border/80 rounded-2xl shadow-xl px-2", themeTokens.navbarBg)}>
        <div className="grid grid-cols-7 h-16">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.path)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 transition-all relative py-1 rounded-xl cursor-pointer",
                  isActive ? themeTokens.accentText : "text-text-muted hover:text-text-main"
                )}
              >
                <div className={cn(
                  "p-1.5 rounded-xl transition-all duration-300", 
                  isActive ? "bg-primary/10 text-primary scale-110" : ""
                )}>
                  <Icon className="w-5 h-5 shrink-0" />
                </div>
                <span className="text-[9px] font-semibold tracking-wide uppercase leading-none mt-0.5">{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Global Command Palette Dialog */}
      <Dialog open={showCommandPalette} onOpenChange={(v) => {
        setShowCommandPalette(v);
        if (!v) setSearchQuery("");
      }}>
        <DialogContent showCloseButton={false} className="max-w-lg bg-bg-card border-border text-text-main p-0 overflow-hidden rounded-xl shadow-2xl">
          <div className="flex items-center border-b border-border px-4 h-12 bg-bg-elevated/20">
            <Search className="w-4 h-4 text-text-dim mr-2.5 shrink-0" />
            <input
              ref={commandInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleCommandPaletteKeyDown}
              placeholder="Search applications, placements, shortcuts..."
              className="flex-1 min-w-0 bg-transparent outline-none border-none text-[13px] text-text-main placeholder:text-text-dim h-full py-2 mr-3"
              autoFocus
            />
            <kbd className="ml-auto bg-bg-elevated border border-border px-1.5 py-0.5 rounded text-[10px] font-mono text-text-dim shrink-0">ESC</kbd>
          </div>

          <div className="max-h-[300px] overflow-y-auto p-2 space-y-2">
            {commandItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-text-dim">
                No matching results found
              </div>
            ) : (
              <div>
                {/* Group items by category */}
                {Array.from(new Set(commandItems.map((i) => i.category))).map((category) => {
                  const categoryItems = commandItems.filter((i) => i.category === category);
                  return (
                    <div key={category} className="space-y-1">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-text-dim px-3 py-1.5">
                        {category}
                      </div>
                      {categoryItems.map((item, index) => {
                        // Global index in flat commandItems
                        const globalIndex = commandItems.findIndex((x) => x.label === item.label);
                        const isSelected = globalIndex === selectedIndex;

                        return (
                          <button
                            key={index}
                            onClick={() => {
                              item.action();
                              setShowCommandPalette(false);
                              setSearchQuery("");
                            }}
                            className={cn(
                              "w-full flex items-center justify-between text-left px-3 py-2 rounded-lg text-xs transition-all",
                              isSelected 
                                ? "bg-bg-elevated text-text-main font-semibold shadow-xs" 
                                : "text-text-muted hover:text-text-main hover:bg-bg-elevated/40"
                            )}
                          >
                            <span className="truncate">{item.label}</span>
                            {isSelected && (
                              <ArrowRight className="w-3.5 h-3.5 text-primary animate-in slide-in-from-left-2 duration-150" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="border-t border-border px-4 py-2 bg-bg-elevated/10 flex items-center gap-4 text-[10px] text-text-dim">
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
          </div>
        </DialogContent>
      </Dialog>

      {/* PWA Install Dialog */}
      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent className="max-w-md bg-bg-card border-border text-text-main rounded-xl shadow-2xl p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-base font-semibold">
              {isIOS ? "Install Career OS on iOS" : "Install Career OS Desktop App"}
            </DialogTitle>
            <DialogDescription className="text-xs text-text-muted leading-relaxed">
              {isIOS 
                ? "Install this app on your iOS device for faster loading times and a full native application layout."
                : "Install this application locally to enable native shortcut support and run in standalone window mode."}
            </DialogDescription>
          </DialogHeader>
          
          {isIOS ? (
            <div className="space-y-3 py-3 text-xs text-text-main">
              <p className="font-semibold text-primary">Instructions for Safari:</p>
              <ol className="list-decimal list-inside space-y-2 font-medium">
                <li>
                  Tap the <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-bg-elevated border border-border text-[10px]">📤 Share</span> button.
                </li>
                <li>
                  Scroll down and tap <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-bg-elevated border border-border text-[10px]">➕ Add to Home Screen</span>.
                </li>
                <li>
                  Tap <span className="font-semibold text-primary">Add</span> in the top-right corner.
                </li>
              </ol>
            </div>
          ) : null}

          <DialogFooter className="flex justify-end gap-2 pt-4 border-t border-border/40 mt-4 text-xs font-semibold">
            <Button
              type="button"
              variant={isIOS ? "default" : "ghost"}
              onClick={() => setShowInstallDialog(false)}
              className={cn(
                "px-4 h-9 font-semibold",
                isIOS 
                  ? "bg-primary hover:bg-primary-hover text-white" 
                  : "text-text-muted hover:text-text-main"
              )}
            >
              {isIOS ? "Done" : "Cancel"}
            </Button>
            {!isIOS && (
              <Button
                type="button"
                onClick={handleConfirmInstall}
                className="bg-primary hover:bg-primary-hover text-white px-4 h-9 font-semibold"
              >
                Install
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mobile Global FAB */}
      <div className="md:hidden fixed bottom-24 right-4 z-40">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="w-12 h-12 rounded-full shadow-lg bg-primary hover:bg-primary-hover p-0 active:scale-95 flex items-center justify-center cursor-pointer"
            >
              <Plus className="w-6 h-6 text-white" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-44 bg-bg-card border-border text-text-main mb-2">
            <DropdownMenuItem onClick={() => setShowAddAppModal(true)} className="cursor-pointer hover:bg-bg-elevated px-2.5 py-2 text-xs font-medium">
              Add Application
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowAddPlacementModal(true)} className="cursor-pointer hover:bg-bg-elevated px-2.5 py-2 text-xs font-medium">
              Add Placement
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Global Add Modals */}
      <AddApplicationModal open={showAddAppModal} onOpenChange={setShowAddAppModal} />
      <AddPlacementModal open={showAddPlacementModal} onOpenChange={setShowAddPlacementModal} />
      
      </div> {/* Close the flex-1 div wrapper */}
    </div>
  );
}
