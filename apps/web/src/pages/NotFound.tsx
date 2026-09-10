import { Button } from "@/components/ui/button";
import { Terminal, Home, ArrowLeft, Search } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-bg-main text-text-main px-4 selection:bg-primary/30">
      <div className="max-w-md w-full text-center space-y-6 p-8 rounded-2xl bg-bg-card border border-border/80 shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Terminal className="w-7 h-7" />
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">404 Error</span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-main">
            Page Not Found
          </h1>
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
            The workspace route you are trying to access doesn't exist or may have been moved.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => window.history.length > 1 ? window.history.back() : setLocation("/")}
            variant="outline"
            className="border-border bg-bg-elevated hover:bg-bg-elevated/80 text-text-main text-xs font-semibold h-10 px-4 flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go Back</span>
          </Button>
          <Button
            onClick={() => setLocation("/")}
            className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold h-10 px-5 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Dashboard</span>
          </Button>
        </div>
      </div>

      <footer className="mt-8 text-xs text-text-dim">
        <span>© 2026 Career OS. All rights reserved.</span>
      </footer>
    </div>
  );
}
