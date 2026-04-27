import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, Github, Mail, ArrowLeft, User } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/lib/api/authApi";
import { toast } from "sonner";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("rohit@gmail.com");
  const [password, setPassword] = useState("rohit");
  const [name, setName] = useState("");

  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: () => {
      toast.success("Welcome back!");
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to log in");
    },
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      toast.success("Account created successfully!");
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to register");
    },
  });

  const isLoading = loginMutation.isPending || registerMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) {
      const [firstName, ...lastNameParts] = name.trim().split(/\s+/);
      const lastName = lastNameParts.join(" ");
      const username = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "") + Math.floor(Math.random() * 1000);
      
      registerMutation.mutate({ 
        email, 
        password, 
        firstName: firstName || name, 
        lastName: lastName || "",
        username: username
      });
    } else {
      loginMutation.mutate({ email, password });
    }
  };

  return (
    <div className="min-h-screen bg-[#020203] text-white flex items-center justify-center p-4 selection:bg-accent/30 selection:text-accent-foreground relative overflow-hidden">
      {/* Background radial glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-accent/10 blur-[130px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[130px]" />

      {/* Back button */}
      <button 
        onClick={() => setLocation("/")}
        className="absolute top-8 left-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </button>

      {/* Login Card */}
      <div className="w-full max-w-[420px] z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-blue-600 shadow-2xl shadow-accent/20 mb-6 group cursor-pointer" onClick={() => setLocation("/")}>
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-2">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h1>
          <p className="text-muted-foreground">
            {isSignUp ? "Sign up to start tracking your events." : "Log in to your dashboard to manage your events."}
          </p>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-[#0a0a0c]/80 backdrop-blur-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {isSignUp && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                    <Input 
                      id="name" 
                      type="text" 
                      placeholder="John Doe" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={isSignUp}
                      className="pl-10 h-12 bg-white/5 border-white/10 focus:border-accent/50 focus:ring-accent/20 transition-all rounded-xl"
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                    className="pl-10 h-12 bg-white/5 border-white/10 focus:border-accent/50 focus:ring-accent/20 transition-all rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {!isSignUp && (
                    <button type="button" className="text-xs text-accent hover:underline">Forgot password?</button>
                  )}
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  className="h-12 bg-white/5 border-white/10 focus:border-accent/50 focus:ring-accent/20 transition-all rounded-xl"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-12 bg-accent hover:bg-accent/90 text-white rounded-xl font-bold text-base shadow-lg shadow-accent/20 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {isSignUp ? "Creating Account..." : "Signing in..."}
                </>
              ) : (
                isSignUp ? "Create Account" : "Log in"
              )}
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0a0a0c] px-4 text-muted-foreground leading-none">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center h-12 rounded-xl border border-white/10 hover:bg-white/5 transition-all font-medium gap-2">
              <Github className="w-5 h-5" />
              Github
            </button>
            <button className="flex items-center justify-center h-12 rounded-xl border border-white/10 hover:bg-white/5 transition-all font-medium gap-2">
              <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-black rounded-sm" />
              </div>
              Google
            </button>
          </div>
        </div>

        <p className="text-center mt-8 text-sm text-muted-foreground">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button 
            onClick={() => setIsSignUp(!isSignUp)} 
            className="text-accent font-semibold hover:underline"
          >
            {isSignUp ? "Log in" : "Sign up for free"}
          </button>
        </p>
      </div>

      {/* Footer info */}
      <div className="absolute bottom-8 text-xs text-muted-foreground/50 flex gap-6">
        <span>© 2024 Event Tracker</span>
        <a href="#" className="hover:text-white">Privacy Policy</a>
        <a href="#" className="hover:text-white">Terms of Service</a>
      </div>
    </div>
  );
}
