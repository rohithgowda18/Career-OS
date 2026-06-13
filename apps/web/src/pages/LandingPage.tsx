import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { 
  ArrowRight, 
  Sparkles, 
  Target, 
  BarChart3, 
  Layout,
  Calendar,
  CheckCircle2,
  Smartphone
} from "lucide-react";
import { useEffect, useState } from "react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
    <div className="min-h-screen bg-[#020203] text-white selection:bg-accent/30 selection:text-accent-foreground overflow-x-hidden">
      {/* Background radial glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "py-4 bg-black/40 backdrop-blur-xl border-b border-white/5" : "py-6 bg-transparent"
      }`}>
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-blue-600 flex items-center justify-center shadow-lg shadow-accent/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Event Tracker</span>
          </div>
          
          <div className="flex items-center gap-4">
            {isInstallable && (
              <Button
                onClick={() => setShowInstallDialog(true)}
                className="bg-accent hover:bg-accent/90 text-white rounded-full px-5 font-semibold gap-2 flex items-center shadow-lg shadow-accent/20 border-none h-10 transition-all hover:scale-[1.02] active:scale-95"
              >
                <Smartphone className="w-4 h-4" />
                <span>Install</span>
              </Button>
            )}
            <button 
              onClick={() => setLocation("/login")}
              className="text-sm font-medium hover:text-white transition-colors"
            >
              Log in
            </button>
            <Button 
              onClick={() => setLocation("/login")}
              className="bg-white text-black hover:bg-white/90 rounded-full px-6 font-semibold h-10"
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
          <div className="container relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-accent mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Target className="w-3.5 h-3.5" />
              <span>Stay Organized. Get Accepted.</span>
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
              Your Career <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-blue-500 to-accent bg-[length:200%_auto] animate-gradient">
                Event Command Center
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
              Track your hackathons, conferences, and internship applications in one beautiful, high-performance dashboard. Built for builders.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
              <Button 
                onClick={() => setLocation("/login")}
                size="lg" 
                className="h-14 px-8 bg-accent hover:bg-accent/90 text-white rounded-full text-lg font-bold shadow-2xl shadow-accent/20 group"
              >
                Join Now — It's Free
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            {/* Preview */}
            <div className="mt-20 relative max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
              <div className="absolute -inset-1 bg-gradient-to-r from-accent to-blue-600 rounded-[28px] blur-2xl opacity-20" />
              <div className="relative rounded-[24px] border border-white/10 bg-[#0a0a0c] p-2 overflow-hidden">
                 <div className="grid grid-cols-3 gap-2 p-4">
                    <div className="col-span-2 h-64 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <Layout className="w-12 h-12 opacity-20" />
                    </div>
                    <div className="space-y-2">
                        <div className="h-[124px] rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                            <BarChart3 className="w-8 h-8 text-accent/40" />
                        </div>
                        <div className="h-[124px] rounded-xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center">
                            <Calendar className="w-8 h-8 text-blue-600/40" />
                        </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Features */}
        <section id="features" className="py-24 bg-black/40">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Master Your Applications</h2>
              <p className="text-muted-foreground">Everything you need to stay on top of your game.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="group rounded-3xl border border-white/10 bg-white/5 p-8 hover:bg-white/[0.08] transition-all">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-6">
                  <Layout className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-3">Kanban Workflow</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Visualize your journey from 'Interested' to 'Accepted' with our intuitive drag-and-drop board.
                </p>
              </div>

              <div className="group rounded-3xl border border-white/10 bg-white/5 p-8 hover:bg-white/[0.08] transition-all">
                <div className="w-12 h-12 rounded-lg bg-blue-600/10 flex items-center justify-center mb-6">
                  <Calendar className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold mb-3">Deadline Calendar</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Never miss an application closing date again. Export your deadlines to Google Calendar or Outlook in one click.
                </p>
              </div>

              <div className="group rounded-3xl border border-white/10 bg-white/5 p-8 hover:bg-white/[0.08] transition-all">
                <div className="w-12 h-12 rounded-lg bg-green-600/10 flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="text-xl font-bold mb-3">Advanced Analytics</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Track your acceptance rates and see exactly where you're succeeding with beautiful data visualizations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 blur-[140px] rounded-full" />
          <div className="container relative z-10 text-center">
            <h2 className="text-4xl md:text-6xl font-bold mb-8">Ready to level up?</h2>
            <Button 
              onClick={() => setLocation("/login")}
              size="lg" 
              className="h-16 px-12 bg-white text-black hover:bg-white/90 rounded-full text-xl font-bold shadow-2xl shadow-white/10"
            >
              Get Started for Free
            </Button>
            <p className="mt-6 text-muted-foreground">Used by thousands of students and developers worldwide.</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 bg-[#020203]">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">Event Tracker</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2026 Event Tracker. Clean. Minimal. Fast.</p>
          </div>
        </div>
      </footer>

      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent className="max-w-md bg-bg-card border-border text-text-main rounded-2xl shadow-2xl p-6">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-black text-white">
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

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 6s linear infinite;
        }
      `}} />
    </div>
  );
}
