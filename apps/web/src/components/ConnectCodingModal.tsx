import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { codingApi, ConnectAccountResponse, Platform } from "@/lib/api/codingApi";
import { toast } from "sonner";
import { Code2, Copy, Check, ExternalLink, ShieldCheck, Loader2, Award, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConnectCodingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialAccount?: ConnectAccountResponse | null;
  defaultPlatform?: Platform;
}

const PLATFORM_CONFIG: Record<Platform, {
  name: string;
  url: string;
  placeholder: string;
  bioLocation: string;
  color: string;
}> = {
  LEETCODE: {
    name: "LeetCode",
    url: "https://leetcode.com/u/",
    placeholder: "e.g. touriste, your_handle",
    bioLocation: "LeetCode Profile Settings -> aboutMe (Bio)",
    color: "text-warning border-warning/30 bg-warning/10",
  },
  CODEFORCES: {
    name: "Codeforces",
    url: "https://codeforces.com/profile/",
    placeholder: "e.g. tourist, your_handle",
    bioLocation: "Codeforces Settings -> Social / First Name / Organization",
    color: "text-primary border-primary/30 bg-primary/10",
  },
  CODECHEF: {
    name: "CodeChef",
    url: "https://www.codechef.com/users/",
    placeholder: "e.g. chef_coder",
    bioLocation: "CodeChef Profile -> Edit Profile -> About / Name",
    color: "text-amber-500 border-amber-500/30 bg-amber-500/10",
  },
  HACKERRANK: {
    name: "HackerRank",
    url: "https://www.hackerrank.com/profile/",
    placeholder: "e.g. hacker_handle",
    bioLocation: "HackerRank Settings -> Profile -> Short Bio / About",
    color: "text-success border-success/30 bg-success/10",
  },
  GEEKSFORGEEKS: {
    name: "GeeksforGeeks",
    url: "https://auth.geeksforgeeks.org/user/",
    placeholder: "e.g. gfg_handle",
    bioLocation: "GeeksforGeeks Profile -> Edit Profile -> Bio / Institution",
    color: "text-emerald-500 border-emerald-500/30 bg-emerald-500/10",
  },
};

export default function ConnectCodingModal({
  open,
  onOpenChange,
  onSuccess,
  initialAccount,
  defaultPlatform = "LEETCODE",
}: ConnectCodingModalProps) {
  const [platform, setPlatform] = useState<Platform>(defaultPlatform);
  const [username, setUsername] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pendingAccount, setPendingAccount] = useState<ConnectAccountResponse | null>(initialAccount || null);

  const selectedConfig = PLATFORM_CONFIG[platform];

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error(`Please enter your ${selectedConfig.name} handle`);
      return;
    }

    try {
      setIsConnecting(true);
      const res = await codingApi.connectAccount({
        platform,
        username: username.trim(),
      });
      setPendingAccount(res);
      toast.success(`Verification code generated for ${selectedConfig.name}!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to connect ${selectedConfig.name} account`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCopyCode = () => {
    if (pendingAccount?.verificationCode) {
      navigator.clipboard.writeText(pendingAccount.verificationCode);
      setCopied(true);
      toast.success("Code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleVerify = async () => {
    if (!pendingAccount?.accountId) return;

    try {
      setIsVerifying(true);
      await codingApi.verifyOwnership(pendingAccount.accountId);
      toast.success(`Successfully verified @${pendingAccount.username}'s ${pendingAccount.platform} account!`);
      onSuccess();
      onOpenChange(false);
      setPendingAccount(null);
      setUsername("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Verification failed. Make sure the code is in your bio/profile.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-bg-card border-border text-text-main">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Connect Coding Platform</DialogTitle>
              <DialogDescription className="text-xs text-text-dim">
                Link your profile to automatically aggregate solved problems, ratings, and track daily progress.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {!pendingAccount ? (
          <form onSubmit={handleConnect} className="space-y-4 pt-2">
            {/* Platform Selector Grid */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-text-muted">Select Platform</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(PLATFORM_CONFIG) as Platform[]).map((p) => {
                  const cfg = PLATFORM_CONFIG[p];
                  const isSelected = platform === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPlatform(p)}
                      className={cn(
                        "p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer text-left",
                        isSelected
                          ? "bg-primary/10 border-primary text-primary shadow-xs"
                          : "bg-bg-elevated/40 border-border text-text-dim hover:text-text-main hover:border-border/80"
                      )}
                    >
                      <Globe className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{cfg.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Username Input */}
            <div className="space-y-2">
              <Label htmlFor="coding-username" className="text-xs font-semibold text-text-muted">
                {selectedConfig.name} Handle / Username
              </Label>
              <Input
                id="coding-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={selectedConfig.placeholder}
                className="bg-bg-elevated/60 border-border text-xs h-10 focus:border-primary/50"
                disabled={isConnecting}
                autoFocus
              />
              <p className="text-[11px] text-text-dim">
                Enter your exact handle on {selectedConfig.name}.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-xs cursor-pointer text-text-dim"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isConnecting || !username.trim()}
                className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold h-9 px-4 cursor-pointer"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Connecting...
                  </>
                ) : (
                  "Next: Verify Ownership"
                )}
              </Button>
            </div>
          </form>
        ) : (
          /* Step 2: Bio Verification Flow */
          <div className="space-y-4 pt-2">
            <div className="p-3.5 bg-bg-elevated/60 border border-border/80 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-main flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                    {pendingAccount.platform}
                  </Badge>
                  <span className="text-primary font-mono font-bold">@{pendingAccount.username}</span>
                </span>
                <a
                  href={`${PLATFORM_CONFIG[pendingAccount.platform]?.url}${pendingAccount.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-text-dim hover:text-primary flex items-center gap-1 font-medium"
                >
                  View Profile <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-text-dim uppercase tracking-wider">
                  Verification Code
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-bg-card border border-border rounded-lg px-3 py-2 font-mono text-sm font-bold text-primary select-all text-center tracking-wider">
                    {pendingAccount.verificationCode}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyCode}
                    className="h-9 px-3 border-border hover:border-primary/40 cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-text-dim" />}
                  </Button>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-text-dim">
                  <span className="w-1.5 h-1.5 rounded-full bg-warning inline-block" />
                  <span>Code expires in <strong>15 minutes</strong></span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs text-text-muted bg-primary/5 border border-primary/10 p-3 rounded-xl">
              <div className="flex items-center gap-1.5 text-primary font-semibold text-xs">
                <ShieldCheck className="w-4 h-4" />
                Verification Instructions
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-text-dim leading-relaxed">
                <li>Copy the verification code above.</li>
                <li>Go to your {PLATFORM_CONFIG[pendingAccount.platform]?.name} profile settings.</li>
                <li>Paste the code into your <strong>{PLATFORM_CONFIG[pendingAccount.platform]?.bioLocation}</strong>.</li>
                <li>Save your profile, then click <strong>Verify Ownership</strong> below.</li>
              </ol>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPendingAccount(null)}
                className="text-xs text-text-dim cursor-pointer"
                disabled={isVerifying}
              >
                Change Handle
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleVerify}
                disabled={isVerifying}
                className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold h-9 px-5 cursor-pointer"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Verifying...
                  </>
                ) : (
                  "Verify Ownership"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
