import { useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

export default function OAuthSuccessPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { setToken } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      if (window.opener) {
        console.log("[Debug OAuth] Detected parent window, posting OAUTH_SUCCESS message and closing popup.");
        window.opener.postMessage({ type: "OAUTH_SUCCESS", token }, window.location.origin);
        window.close();
      } else {
        console.error("[Debug OAuth] No parent window found. Popup communication failed.");
        toast.error("OAuth authentication failed: parent window could not be reached.");
        setLocation("/login?oauth_error=no_parent");
      }
    } else {
      toast.error("Authentication failed: No token received");
      setLocation("/login");
    }
  }, [setLocation, queryClient, setToken]);

  return (
    <div className="min-h-screen bg-bg-main text-text-main flex flex-col items-center justify-center p-6">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
        <h1 className="text-2xl font-black tracking-tight uppercase">Finalizing Connection</h1>
        <p className="text-text-muted text-[10px] font-bold uppercase tracking-[0.2em]">Synchronizing Identity Protocol...</p>
      </div>
    </div>
  );
}
