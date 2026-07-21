import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { 
  ArrowRight, 
  Terminal, 
  Target, 
  Layers,
  Calendar,
  CheckCircle2,
  Smartphone,
  Briefcase,
  Sparkles,
  BarChart3,
  Check,
  Clock,
  ChevronRight,
  TrendingUp,
  FileCode,
  Github,
  Linkedin,
  Mail,
  ExternalLink,
  Globe,
  Shield
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

  // Fire-and-forget background warm-up request to trigger Render cold-start while user views Landing Page
  useEffect(() => {
    axios.get(`${BACKEND_URL}/actuator/health`, { timeout: 10000 }).catch(() => {
      // Silently ignore errors - warm-up is non-blocking background request
    });
  }, []);

  return (
    <div className="min-h-screen bg-bg-main text-text-main font-sans overflow-x-hidden relative selection:bg-primary/30">
      
      {/* Navbar */}
      <nav className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-200",
        scrolled ? "py-3 bg-bg-main/80 backdrop-blur-md border-b border-border/80" : "py-4 bg-transparent"
      )}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div 
            className="flex items-center gap-2.5 group cursor-pointer" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-xs">
              <Terminal className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-text-main">Career OS</span>
          </div>
          
          <div className="flex items-center gap-3">
            {isInstallable && (
              <Button
                onClick={() => setShowInstallDialog(true)}
                variant="outline"
                className="bg-bg-elevated/60 hover:bg-bg-elevated text-text-main border-border rounded-lg h-9 text-xs font-semibold px-3 flex items-center gap-1.5 cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Install App</span>
                <span className="sm:hidden">Install</span>
              </Button>
            )}
            <button 
              onClick={() => setLocation("/login")}
              className="text-xs font-semibold text-text-muted hover:text-text-main transition-colors px-2 py-1 cursor-pointer"
            >
              Log in
            </button>
            <Button 
              onClick={() => setLocation("/login")}
              className="bg-primary hover:bg-primary-hover text-white rounded-lg px-4 h-9 text-xs font-semibold cursor-pointer shadow-xs"
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Hero & Content */}
      <main className="relative pt-24 sm:pt-32 pb-16">
        {/* Background Subtle Gradient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none -z-10" />

        {/* Hero Section */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Built for software engineering careers</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-text-main max-w-3xl mx-auto leading-[1.12]">
            Your career. One operating system.
          </h1>

          <p className="max-w-xl mx-auto text-sm sm:text-base text-text-muted leading-relaxed">
            Track opportunities, placements, deadlines, skills, and career progress in one focused workspace built for software engineering students.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button 
              onClick={() => setLocation("/login")}
              className="w-full sm:w-auto h-11 px-6 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-semibold shadow-xs flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Get started for free</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Button>
            <Button 
              onClick={() => setLocation("/login")}
              variant="outline"
              className="w-full sm:w-auto h-11 px-6 bg-bg-card hover:bg-bg-elevated text-text-main border-border rounded-lg text-xs font-semibold cursor-pointer"
            >
              Log in
            </Button>
          </div>
        </section>

        {/* Realistic Product Preview Component */}
        <section className="pt-12 sm:pt-16 max-w-5xl mx-auto px-4 sm:px-6">
          <div className="rounded-xl border border-border/80 bg-bg-card shadow-2xl overflow-hidden transition-all">
            {/* App Window Top Bar */}
            <div className="bg-bg-elevated/80 border-b border-border px-4 py-3 flex items-center justify-between text-xs text-text-muted">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-border" />
                  <div className="w-3 h-3 rounded-full bg-border" />
                  <div className="w-3 h-3 rounded-full bg-border" />
                </div>
                <div className="ml-3 flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-bg-main border border-border/60 text-[11px] font-mono text-text-muted">
                  <Terminal className="w-3 h-3 text-primary" />
                  <span>career-os // dashboard</span>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>System Active</span>
              </div>
            </div>

            {/* Dashboard Inner Preview */}
            <div className="p-4 sm:p-6 space-y-6 bg-bg-main/60">
              {/* Metric Cards Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-lg bg-bg-card border border-border space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-text-muted font-medium">
                    <span>Deadlines Today</span>
                    <Clock className="w-3.5 h-3.5 text-rose-400" />
                  </div>
                  <div className="text-lg font-bold text-text-main">2 Closing</div>
                  <div className="text-[10px] text-rose-400 font-medium">Google, HackMIT</div>
                </div>

                <div className="p-3.5 rounded-lg bg-bg-card border border-border space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-text-muted font-medium">
                    <span>Interviews Scheduled</span>
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="text-lg font-bold text-text-main">3 This Week</div>
                  <div className="text-[10px] text-primary font-medium">Stripe, Atlassian</div>
                </div>

                <div className="p-3.5 rounded-lg bg-bg-card border border-border space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-text-muted font-medium">
                    <span>Active Pipeline</span>
                    <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="text-lg font-bold text-text-main">12 Positions</div>
                  <div className="text-[10px] text-text-muted">Campus & Referral</div>
                </div>

                <div className="p-3.5 rounded-lg bg-bg-card border border-border space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-text-muted font-medium">
                    <span>Offers Received</span>
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-lg font-bold text-text-main">1 Decision</div>
                  <div className="text-[10px] text-emerald-400 font-medium">Awaiting response</div>
                </div>
              </div>

              {/* Main Content Preview Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left: Active Pipeline List */}
                <div className="lg:col-span-2 rounded-lg bg-bg-card border border-border p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-primary" />
                      <h4 className="text-xs font-semibold text-text-main">Placement & Opportunity Pipeline</h4>
                    </div>
                    <span className="text-[10px] font-mono text-text-muted">Sorted by Urgency</span>
                  </div>

                  <div className="space-y-2.5">
                    <div className="p-2.5 rounded-md bg-bg-elevated/40 border border-border/60 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-text-main">Stripe — Backend Engineering Intern</div>
                        <div className="text-[11px] text-text-muted">Technical Interview Round 2</div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                        Interviewing
                      </span>
                    </div>

                    <div className="p-2.5 rounded-md bg-bg-elevated/40 border border-border/60 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-text-main">Google — Software Engineering 2026</div>
                        <div className="text-[11px] text-text-muted">Online OA Assessment Completed</div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Assessment
                      </span>
                    </div>

                    <div className="p-2.5 rounded-md bg-bg-elevated/40 border border-border/60 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-text-main">HackMIT 2026 — Open Source Track</div>
                        <div className="text-[11px] text-text-muted">Proposal Submitted</div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Submitted
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Career Routine & Growth */}
                <div className="rounded-lg bg-bg-card border border-border p-4 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                    <Target className="w-4 h-4 text-primary" />
                    <h4 className="text-xs font-semibold text-text-main">Daily Career Routine</h4>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 p-2 rounded bg-bg-elevated/40 text-text-muted">
                      <div className="w-4 h-4 rounded bg-primary text-white flex items-center justify-center text-[10px]">
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="line-through text-text-dim">Solve 2 LeetCode Mediums</span>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded bg-bg-elevated/40 text-text-muted">
                      <div className="w-4 h-4 rounded bg-primary text-white flex items-center justify-center text-[10px]">
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="line-through text-text-dim">Review Placement Resume PDF</span>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded bg-bg-elevated/40 text-text-main font-medium border border-primary/30">
                      <div className="w-4 h-4 rounded border border-primary flex items-center justify-center text-[10px]" />
                      <span>Complete System Design Module</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Value Section */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-main">
              Everything your career needs, without the chaos.
            </h2>
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
              Consolidate scattered spreadsheets, notes, emails, and deadlines into one clean workspace.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="rounded-xl border border-border bg-bg-card p-6 space-y-3 hover:border-primary/40 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-text-main">Applications & Opportunities</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Track hackathons, conferences, workshops, internships, and opportunities from interested to accepted.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-bg-card p-6 space-y-3 hover:border-primary/40 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Briefcase className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-text-main">Placements & Career Pipeline</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Manage job and campus placement applications, assessments, interviews, offers, and important dates.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-bg-card p-6 space-y-3 hover:border-primary/40 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-text-main">Deadlines & Unified Calendar</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Keep application deadlines, assessment dates, and interview schedules organized in one clear timeline.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-bg-card p-6 space-y-3 hover:border-primary/40 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-text-main">Skills & Career Growth</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Organize your technical skills by category and track your continuous career development and daily goals.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-bg-card p-6 space-y-3 hover:border-primary/40 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-text-main">AI-Assisted Extraction</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Turn opportunity details and placement emails into structured database entries faster with AI assistance.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-bg-card p-6 space-y-3 hover:border-primary/40 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-text-main">Career Analytics & Insights</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Understand your applications, pipeline yield, and overall career preparation through clear analytics.
              </p>
            </div>
          </div>
        </section>

        {/* Workflow Steps Section */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32">
          <div className="rounded-xl border border-border bg-bg-card p-6 sm:p-10 space-y-8">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <h3 className="text-xl sm:text-2xl font-bold text-text-main">From opportunity to accepted offer</h3>
              <p className="text-xs text-text-muted">Career OS connects every step of your software engineering journey.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-2 text-center text-xs">
              <div className="p-3 rounded-lg bg-bg-elevated/40 border border-border/60 space-y-1">
                <div className="font-semibold text-text-main">1. Discover</div>
                <div className="text-[11px] text-text-muted">Opportunities</div>
              </div>
              <div className="hidden sm:flex items-center justify-center text-text-muted">
                <ChevronRight className="w-4 h-4" />
              </div>
              <div className="p-3 rounded-lg bg-bg-elevated/40 border border-border/60 space-y-1">
                <div className="font-semibold text-text-main">2. Track</div>
                <div className="text-[11px] text-text-muted">Applications</div>
              </div>
              <div className="hidden sm:flex items-center justify-center text-text-muted">
                <ChevronRight className="w-4 h-4" />
              </div>
              <div className="p-3 rounded-lg bg-bg-elevated/40 border border-border/60 space-y-1">
                <div className="font-semibold text-text-main">3. Prepare</div>
                <div className="text-[11px] text-text-muted">Skills & Routine</div>
              </div>
              <div className="hidden sm:flex items-center justify-center text-text-muted sm:hidden">
                <ChevronRight className="w-4 h-4" />
              </div>
              <div className="p-3 rounded-lg bg-bg-elevated/40 border border-border/60 space-y-1">
                <div className="font-semibold text-text-main">4. Interview</div>
                <div className="text-[11px] text-text-muted">Assessments</div>
              </div>
              <div className="hidden sm:flex items-center justify-center text-text-muted">
                <ChevronRight className="w-4 h-4" />
              </div>
              <div className="p-3 rounded-lg bg-bg-elevated/40 border border-border/60 space-y-1 col-span-2 sm:col-span-1">
                <div className="font-semibold text-primary">5. Offer</div>
                <div className="text-[11px] text-primary">Acceptance</div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 text-center space-y-6">
          <div className="rounded-xl border border-border bg-gradient-to-b from-bg-card to-bg-elevated/40 p-8 sm:p-12 space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-main">
              Build your career with a system.
            </h2>
            <p className="max-w-md mx-auto text-xs sm:text-sm text-text-muted leading-relaxed">
              Keep your opportunities, placements, deadlines, skills, and progress organized in one place.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button 
                onClick={() => setLocation("/login")}
                className="w-full sm:w-auto h-11 px-6 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-semibold shadow-xs flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Get started for free</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>
              <Button 
                onClick={() => setLocation("/login")}
                variant="outline"
                className="w-full sm:w-auto h-11 px-6 bg-bg-card hover:bg-bg-elevated text-text-main border-border rounded-lg text-xs font-semibold cursor-pointer"
              >
                Log in
              </Button>
            </div>
          </div>
        </section>

        {/* Professional Product Footer */}
        <footer className="mt-24 border-t border-border bg-bg-card/30 pt-12 pb-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-border/60">
              
              {/* Brand & Attribution */}
              <div className="md:col-span-2 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                    <Terminal className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="font-semibold text-sm text-text-main">Career OS</span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed max-w-sm">
                  A personal career operating system for software engineering students and early-career developers.
                </p>
                <div className="text-xs text-text-dim pt-1 flex items-center gap-1.5 flex-wrap">
                  <span>Built by <strong className="text-text-main font-semibold">Rohith Gowda K</strong></span>
                  <span className="text-text-dim">•</span>
                  <a
                    href="https://www.rohith.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-text-muted hover:text-primary transition-colors font-medium underline underline-offset-2 inline-flex items-center gap-1"
                  >
                    <Globe className="w-3 h-3 text-primary" />
                    <span>Portfolio</span>
                  </a>
                  <span className="text-text-dim">•</span>
                  <a
                    href="https://github.com/rohithgowda18"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-text-muted hover:text-primary transition-colors font-medium underline underline-offset-2 inline-flex items-center gap-1"
                  >
                    <Github className="w-3 h-3 text-text-main" />
                    <span>GitHub</span>
                  </a>
                </div>
              </div>

              {/* Resources */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-text-main uppercase tracking-wider">Resources</h4>
                <ul className="space-y-2 text-xs text-text-muted">
                  <li>
                    <a
                      href="https://github.com/rohithgowda18/Career-OS"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-text-main transition-colors inline-flex items-center gap-1.5"
                    >
                      <Github className="w-3.5 h-3.5" />
                      <span>GitHub Repository</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://github.com/rohithgowda18/Career-OS/issues"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-text-main transition-colors inline-flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Report an Issue</span>
                    </a>
                  </li>
                  <li>
                    <button
                      onClick={() => setLocation("/privacy")}
                      className="hover:text-text-main transition-colors inline-flex items-center gap-1.5 cursor-pointer text-left"
                    >
                      <Shield className="w-3.5 h-3.5 text-primary" />
                      <span>Privacy Policy</span>
                    </button>
                  </li>
                </ul>
              </div>

              {/* Connect */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-text-main uppercase tracking-wider">Connect</h4>
                <ul className="space-y-2 text-xs text-text-muted">
                  <li>
                    <a
                      href="https://www.rohith.app"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-text-main transition-colors inline-flex items-center gap-1.5"
                    >
                      <Globe className="w-3.5 h-3.5 text-primary" />
                      <span>Portfolio (rohith.app)</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://github.com/rohithgowda18"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-text-main transition-colors inline-flex items-center gap-1.5"
                    >
                      <Github className="w-3.5 h-3.5" />
                      <span>GitHub Profile</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.linkedin.com/in/rohithgowdak18"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-text-main transition-colors inline-flex items-center gap-1.5"
                    >
                      <Linkedin className="w-3.5 h-3.5 text-[#0A66C2]" />
                      <span>LinkedIn</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="mailto:rohithgowdak18@gmail.com"
                      className="hover:text-text-main transition-colors inline-flex items-center gap-1.5"
                    >
                      <Mail className="w-3.5 h-3.5 text-text-muted" />
                      <span>Contact Support</span>
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Copyright Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-dim">
              <p>© 2026 Career OS. All rights reserved.</p>
              <div className="flex items-center gap-4 text-[11px]">
                <span>Version 1.3.0</span>
              </div>
            </div>
          </div>
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
