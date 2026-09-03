import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { codingApi, ConnectAccountResponse } from "@/lib/api/codingApi";
import { toast } from "sonner";
import { Code2, Copy, Check, ExternalLink, ShieldCheck, Loader2, AlertCircle } from "lucide-react";

interface ConnectCodingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialAccount?: ConnectAccountResponse | null;
}

export default function ConnectCodingModal({
  open,
  onOpenChange,
  onSuccess,
  initialAccount,
}: ConnectCodingModalProps) {
  const [username, setUsername] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pendingAccount, setPendingAccount] = useState<ConnectAccountResponse | null>(initialAccount || null);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error("Please enter your LeetCode username");
      return;
    }

    try {
      setIsConnecting(true);
      const res = await codingApi.connectAccount({
        platform: "LEETCODE",
        username: username.trim(),
      });
      setPendingAccount(res);
      toast.success("Verification code generated!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to connect LeetCode account");
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
      toast.success(`Successfully verified @${pendingAccount.username}'s LeetCode account!`);
      onSuccess();
      onOpenChange(false);
      setPendingAccount(null);
      setUsername("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Verification failed. Make sure the code is in your bio.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-bg-card border-border text-text-main">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-warning/10 border border-warning/20 flex items-center justify-center text-warning">
              <Code2 className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold">Connect LeetCode Profile</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-text-dim">
            Link your public LeetCode profile to automatically showcase solved problems, difficulty breakdowns, and contest ratings.
          </DialogDescription>
        </DialogHeader>

        {!pendingAccount ? (
          <form onSubmit={handleConnect} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="leetcode-username" className="text-xs font-semibold text-text-muted">
                LeetCode Username
              </Label>
              <Input
                id="leetcode-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. touriste, your_handle"
                className="bg-bg-elevated/60 border-border text-xs h-10 focus:border-primary/50"
                disabled={isConnecting}
                autoFocus
              />
              <p className="text-[11px] text-text-dim">
                Enter your exact LeetCode username as shown in your profile URL (leetcode.com/u/username).
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
                    Generating...
                  </>
                ) : (
                  "Next: Verify Ownership"
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="p-3.5 bg-bg-elevated/60 border border-border/80 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-main">
                  Account: <span className="text-primary font-mono">@{pendingAccount.username}</span>
                </span>
                <a
                  href={`https://leetcode.com/u/${pendingAccount.username}`}
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
              </div>
            </div>

            <div className="space-y-2 text-xs text-text-muted bg-primary/5 border border-primary/10 p-3 rounded-xl">
              <div className="flex items-center gap-1.5 text-primary font-semibold text-xs">
                <ShieldCheck className="w-4 h-4" />
                Instructions
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-text-dim leading-relaxed">
                <li>Copy the verification code above.</li>
                <li>Go to your LeetCode profile settings and paste the code into your <strong>aboutMe (Bio)</strong>.</li>
                <li>Save your bio on LeetCode, then click <strong>Verify Ownership</strong> below.</li>
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
