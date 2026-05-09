import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, ArrowLeft, Key, Mail } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/lib/api/authApi";
import { toast } from "sonner";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const queryClient = useQueryClient();
  const searchParams = new URLSearchParams(window.location.search);
  const redirectPath = searchParams.get("redirect") || "/dashboard";

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: async (data: any) => {
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      toast.success("Authentication successful");
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      setLocation(redirectPath);
    },
    onError: (error: any) => toast.error(error.message || "Access denied"),
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data: any) => {
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      toast.success("Account initialized");
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      setLocation(redirectPath);
    },
    onError: (error: any) => toast.error(error.message || "Registration failed"),
  });

  const isLoading = loginMutation.isPending || registerMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (isSignUp) {
      registerMutation.mutate({
        email: email.trim().toLowerCase(),
        password,
      });
    } else {
      loginMutation.mutate({ email: email.trim().toLowerCase(), password });
    }
  };

  return (
    <div className="min-h-screen bg-bg-main text-text-main flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[140px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-accent/10 blur-[140px]" />

      <button
        onClick={() => setLocation("/")}
        className="absolute top-10 left-10 flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Return to Origin
      </button>

      <div className="w-full max-w-[440px] z-10 animate-in fade-in zoom-in duration-700">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-primary to-accent mb-8 shadow-2xl shadow-primary/30 active:scale-95 transition-transform cursor-pointer">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter mb-3">{isSignUp ? "Initialize Identity" : "Portal Access"}</h1>
          <p className="text-[11px] font-bold text-text-muted uppercase tracking-[0.2em] opacity-60">
            {isSignUp ? "Connect to the Application Grid" : "Resuming Tracking Protocol"}
          </p>
        </div>

        <div className="card-premium p-10 bg-bg-card/40 backdrop-blur-3xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2.5">
              <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                 <Mail className="w-3.5 h-3.5" /> Identity Email
              </Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="identity@domain.com"
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                className="input-premium h-14 text-sm font-bold" 
              />
            </div>
            <div className="space-y-2.5">
              <Label htmlFor="password" name="password" className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                 <Key className="w-3.5 h-3.5" /> Access Key
              </Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••"
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                className="input-premium h-14 text-sm font-bold" 
              />
            </div>

            <Button 
              type="submit" 
              disabled={isLoading} 
              className="w-full btn-primary h-14 mt-6 text-base tracking-tight shadow-xl"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isSignUp ? "Establish Account" : "Authorize Access"}
            </Button>
          </form>

          <div className="mt-10 pt-8 border-t border-border flex flex-col items-center gap-4">
            <div className="grid grid-cols-2 gap-4 w-full">
              <a 
                href="http://localhost:8080/oauth2/authorization/google"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-[10px] font-black uppercase tracking-widest"
              >
                <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" className="w-4 h-4" />
                Google
              </a>
              <a 
                href="http://localhost:8080/oauth2/authorization/github"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-[10px] font-black uppercase tracking-widest"
              >
                <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="GitHub" className="w-4 h-4 invert" />
                GitHub
              </a>
            </div>
            
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[10px] font-black text-primary hover:text-primary-hover transition-all uppercase tracking-[0.3em] hover:tracking-[0.4em] mt-4"
            >
              {isSignUp ? "Existing User? Auth Here" : "New User? Register Slot"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
