import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { 
  ArrowRight, 
  Sparkles, 
  Target, 
  Users, 
  BarChart3, 
  ShieldCheck,
  Zap,
  Layout
} from "lucide-react";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const [scrolled, setScrolled] = useState(false);

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
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#about" className="hover:text-white transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setLocation("/login")}
              className="text-sm font-medium hover:text-white transition-colors hidden sm:block"
            >
              Log in
            </button>
            <Button 
              onClick={() => setLocation("/login")}
              className="bg-white text-black hover:bg-white/90 rounded-full px-6 font-semibold"
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
              <Sparkles className="w-3.5 h-3.5" />
              <span>Powered by Advanced AI</span>
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
              Manage Events <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-blue-500 to-accent bg-[length:200%_auto] animate-gradient">
                With Intelligence
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
              The only platform that helps you discover, track, and secure spots at world-class events using predictive analytics and automated networking.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
              <Button 
                onClick={() => setLocation("/login")}
                size="lg" 
                className="h-14 px-8 bg-accent hover:bg-accent/90 text-white rounded-full text-lg font-bold shadow-2xl shadow-accent/20 group"
              >
                Start for Free
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <button className="h-14 px-8 rounded-full border border-white/10 hover:bg-white/5 transition-all text-lg font-medium">
                Watch Demo
              </button>
            </div>

            {/* Mock Dashboard Preview */}
            <div className="mt-20 relative max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
              <div className="absolute -inset-1 bg-gradient-to-r from-accent to-blue-600 rounded-[28px] blur-2xl opacity-20" />
              <div className="relative rounded-[24px] border border-white/10 bg-[#0a0a0c] p-2 overflow-hidden">
                <div className="rounded-[18px] overflow-hidden border border-white/5 aspect-video bg-gradient-to-br from-white/5 to-transparent flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4 opacity-40">
                    <Layout className="w-16 h-16" />
                    <span className="text-sm font-medium">Dashboard Preview</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bento Grid Features */}
        <section id="features" className="py-24 bg-black/40">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Everything you need to <br/> scale your participation</h2>
              <p className="text-muted-foreground">From individual tracking to global team coordination.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 - Big */}
              <div className="md:col-span-2 relative group overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent p-1">
                <div className="absolute inset-0 bg-accent/20 opacity-0 group-hover:opacity-100 blur-[100px] transition-opacity" />
                <div className="relative h-full bg-[#0a0a0c] rounded-[22px] p-8 md:p-12">
                   <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-6">
                     <Target className="w-6 h-6 text-accent" />
                   </div>
                   <h3 className="text-2xl font-bold mb-4">Smart Success Scoring</h3>
                   <p className="text-muted-foreground text-lg mb-8 max-w-md">
                     Our AI analyzes your profile, skills, and historical data to predict your chances at thousands of global hackathons and conferences.
                   </p>
                   <div className="flex items-center gap-4 text-sm font-semibold text-accent cursor-pointer group/link">
                     Explore Analytics <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                   </div>
                </div>
              </div>

              {/* Feature 2 - Small */}
              <div className="group overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent p-8 md:p-10 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-lg bg-blue-600/10 flex items-center justify-center mb-6">
                    <Users className="w-6 h-6 text-blue-500" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Team Formation</h3>
                  <p className="text-muted-foreground">Coordinate with team members across different time zones easily.</p>
                </div>
                <div className="mt-8 pt-6 border-t border-white/5 flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0a0a0c] bg-white/10 flex items-center justify-center text-[10px] font-bold">U{i}</div>
                  ))}
                  <div className="w-8 h-8 rounded-full border-2 border-[#0a0a0c] bg-accent/20 text-accent flex items-center justify-center text-[10px] font-bold">+</div>
                </div>
              </div>

              {/* Feature 3 - Small */}
              <div className="group overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent p-8 md:p-10">
                <div className="w-12 h-12 rounded-lg bg-orange-600/10 flex items-center justify-center mb-6">
                  <Zap className="w-6 h-6 text-orange-500" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Conflict Alerts</h3>
                <p className="text-muted-foreground">Never miss a deadline or double-book your events with smart calendar syncing.</p>
              </div>

              {/* Feature 4 - Big */}
              <div className="md:col-span-2 relative group overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent p-8 md:p-12">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="flex-1">
                    <div className="w-12 h-12 rounded-lg bg-green-600/10 flex items-center justify-center mb-6">
                      <BarChart3 className="w-6 h-6 text-green-500" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4">Real-time Insights</h3>
                    <p className="text-muted-foreground text-lg">
                      Track your acceptance rates, networking growth, and skill acquisition over time with beautiful, interactive visualizations.
                    </p>
                  </div>
                  <div className="flex-shrink-0 w-full md:w-64 h-32 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-accent/20 to-transparent" />
                    <Sparkles className="w-12 h-12 text-accent/40" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="py-20 border-y border-white/5">
          <div className="container">
            <p className="text-center text-sm font-medium text-muted-foreground uppercase tracking-widest mb-12">Trusted by builders from</p>
            <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-30 grayscale hover:grayscale-0 transition-all">
              <div className="text-2xl font-bold tracking-tighter">METΛ</div>
              <div className="text-2xl font-bold tracking-tighter">OPENAI</div>
              <div className="text-2xl font-bold tracking-tighter">STRIPE</div>
              <div className="text-2xl font-bold tracking-tighter">GITHUB</div>
              <div className="text-2xl font-bold tracking-tighter">VERCEL</div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 blur-[140px] rounded-full" />
          <div className="container relative z-10 text-center">
            <h2 className="text-4xl md:text-6xl font-bold mb-8">Ready to secure <br/> your next big event?</h2>
            <Button 
              onClick={() => setLocation("/login")}
              size="lg" 
              className="h-16 px-12 bg-white text-black hover:bg-white/90 rounded-full text-xl font-bold shadow-2xl shadow-white/10"
            >
              Get Started Now
            </Button>
            <p className="mt-6 text-muted-foreground">Free for individuals. No credit card required.</p>
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
            
            <div className="flex gap-8 text-sm text-muted-foreground">
              <a href="#" className="hover:text-white transition-colors">Twitter</a>
              <a href="#" className="hover:text-white transition-colors">GitHub</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
            </div>

            <p className="text-sm text-muted-foreground">© 2024 Event Tracker. Built for the future.</p>
          </div>
        </div>
      </footer>

      {/* Custom Styles for gradient animation */}
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
