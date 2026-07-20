import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { 
  ArrowRight, 
  Terminal, 
  Target, 
  Layers,
  Calendar,
  CheckCircle2,
  Smartphone
} from "lucide-react";
import { useEffect, useState } from "react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import axios from "axios";
import { BACKEND_URL } from "@/lib/restClient";

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const [scrolled, setScrolled] = useState(false);
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

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-bg-main text-text-main font-sans overflow-x-hidden relative selection:bg-primary/30">
      
      {/* Navigation */}
      <nav className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-200",
        scrolled ? "py-3 bg-bg-main/80 backdrop-blur-md border-b border-border" : "py-5 bg-transparent"
      )}>
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <Terminal className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-text-main">Career OS</span>
          </div>
          
          <div className="flex items-center gap-3">
            {isInstallable && (
              <Button
                onClick={() => setShowInstallDialog(true)}
                className="bg-bg-elevated hover:bg-bg-elevated/85 text-text-main border border-border rounded-lg h-9 text-xs font-semibold px-3 flex items-center gap-1.5 cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Install</span>
              </Button>
            )}
            <button 
              onClick={() => setLocation("/login")}
              className="text-xs font-medium text-text-muted hover:text-text-main transition-colors mr-1 cursor-pointer"
            >
              Log in
            </button>
            <Button 
              onClick={() => setLocation("/login")}
              className="bg-primary hover:bg-primary-hover text-white rounded-lg px-4 h-9 text-xs font-semibold cursor-pointer"
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      <main className="relative pt-28 pb-16 md:pt-40 md:pb-24">
        {/* Hero Section */}
        <section className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-semibold text-primary">
            <Target className="w-3 h-3" />
            <span>Track, Manage, Accept</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-text-main max-w-2xl mx-auto leading-[1.1]">
            The workspace for your career growth.
          </h1>

          <p className="max-w-lg mx-auto text-xs sm:text-sm text-text-muted leading-relaxed">
            Organize hackathons, internship applications, placements, and calendar deadlines in one highly-focused productivity workspace. Built for builders.
          </p>

          <div className="flex justify-center pt-2">
            <Button 
              onClick={() => setLocation("/login")}
              className="h-10 px-5 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-2 group cursor-pointer"
            >
              <span>Get started for free</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </div>

          {/* Simple Product Preview Mockup */}
          <div className="pt-10 max-w-3xl mx-auto animate-in fade-in duration-700">
            <div className="relative rounded-xl border border-border bg-bg-card p-3 shadow-2xl">
              <div className="flex items-center gap-1.5 border-b border-border/60 pb-2.5 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-border" />
                <div className="w-2.5 h-2.5 rounded-full bg-border" />
                <div className="w-2.5 h-2.5 rounded-full bg-border" />
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-3">
                  <div className="h-28 rounded-lg bg-bg-elevated/40 border border-border/60 flex items-center justify-center">
                    <Layers className="w-6 h-6 text-text-dim/30" />
                  </div>
                  <div className="h-14 rounded-lg bg-bg-elevated/40 border border-border/60" />
                </div>
                <div className="space-y-3">
                  <div className="h-44 rounded-lg bg-bg-elevated/40 border border-border/60 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-text-dim/30" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights */}
        <section id="features" className="max-w-5xl mx-auto px-4 pt-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border bg-bg-card p-5 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Layers className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-xs font-semibold text-text-main uppercase tracking-wider">Application Funnel</h3>
              <p className="text-[11px] text-text-muted leading-relaxed">
                Log and tracking hackathons and internship proposals with custom categories and status tags.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-bg-card p-5 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Calendar className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-xs font-semibold text-text-main uppercase tracking-wider">Unified Deadlines</h3>
              <p className="text-[11px] text-text-muted leading-relaxed">
                Sync assessment due dates and interviews dynamically, displayed in a side-by-side hybrid grid calendar.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-bg-card p-5 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <CheckCircle2 className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-xs font-semibold text-text-main uppercase tracking-wider">AI Extraction Tool</h3>
              <p className="text-[11px] text-text-muted leading-relaxed">
                Save time using a browser bookmarklet that uses AI to parse placement specifications directly from emails.
              </p>
            </div>
          </div>
        </section>

        {/* Quiet Footer */}
        <footer className="max-w-5xl mx-auto px-4 mt-20 pt-8 border-t border-border/60 flex items-center justify-between text-xs text-text-dim">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
              <Terminal className="w-3 text-white" />
            </div>
            <span className="font-semibold text-text-main">Career OS</span>
          </div>
          <p>© 2026 Career OS. All rights reserved.</p>
        </footer>
      </main>

      {/* Install App dialog */}
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
    </div>
  );
}
