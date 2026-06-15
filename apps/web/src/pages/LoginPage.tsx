import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Terminal, Loader2, ArrowLeft, Key, Mail, Eye, EyeOff } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/lib/api/authApi";
import { BACKEND_URL } from "@/lib/restClient";
import { toast } from "sonner";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const queryClient = useQueryClient();
  const searchParams = new URLSearchParams(window.location.search);
  const redirectPath = searchParams.get("redirect") || "/dashboard";

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: async (data: any) => {
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      toast.success("Signed in successfully");
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      setLocation(redirectPath);
    },
    onError: (error: any) => toast.error(error.message || "Invalid email or password"),
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data: any) => {
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      toast.success("Account created successfully");
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
      
      {/* Quiet Top Left Exit Button */}
      <button
        onClick={() => setLocation("/")}
        className="absolute top-4 left-4 sm:top-8 sm:left-8 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-text-dim hover:text-text-muted transition-colors z-20 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Homepage
      </button>

      <div className="w-full max-w-[400px] z-10 animate-in fade-in duration-300">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary mb-5 shadow-sm">
            <Terminal className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-[28px] font-bold tracking-tight mb-2">
            {isSignUp ? "Create your account" : "Sign in to Career OS"}
          </h1>
          <p className="text-xs text-text-muted">
            {isSignUp ? "Start organizing your job applications today" : "Welcome back. Access your workspace"}
          </p>
        </div>

        <div className="bg-bg-card border border-border rounded-xl p-6 md:p-8 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[11px] font-semibold text-text-muted flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-text-dim" /> Email Address
              </Label>
              <Input 
                id="email" 
                type="email" 
                name="email"
                autoComplete="username"
                placeholder="you@example.com"
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                className="bg-bg-elevated border-border h-10 text-xs font-semibold focus:border-primary/65" 
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[11px] font-semibold text-text-muted flex items-center gap-2">
                <Key className="w-3.5 h-3.5 text-text-dim" /> Password
              </Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  name="password"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  placeholder="••••••••"
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  className="bg-bg-elevated border-border h-10 text-xs font-semibold pr-10 focus:border-primary/65" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-dim hover:text-text-muted cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isLoading} 
              className="w-full bg-primary hover:bg-primary-hover text-white font-semibold h-10 mt-4 rounded-lg text-xs"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              {isSignUp ? "Sign Up" : "Continue"}
            </Button>
          </form>

          {/* Social OAuth block */}
          <div className="mt-6 pt-5 border-t border-border flex flex-col items-center gap-4">
            <div className="text-[10px] uppercase font-bold tracking-wider text-text-dim">Or continue with</div>
            <div className="grid grid-cols-2 gap-3 w-full">
              <a 
                href={`${BACKEND_URL}/oauth2/authorization/google`}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-bg-elevated border border-border hover:bg-bg-elevated/80 transition-colors text-[11px] font-semibold text-text-main"
              >
                <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" className="w-4 h-4" />
                <span>Google</span>
              </a>
              <a 
                href={`${BACKEND_URL}/oauth2/authorization/github`}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-bg-elevated border border-border hover:bg-bg-elevated/80 transition-colors text-[11px] font-semibold text-text-main"
              >
                <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="GitHub" className="w-4 h-4 invert" />
                <span>GitHub</span>
              </a>
            </div>
            
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[11px] font-semibold text-primary hover:text-primary-hover transition-all mt-3 cursor-pointer"
            >
              {isSignUp ? "Already have an account? Sign In" : "New to Career OS? Create Account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
