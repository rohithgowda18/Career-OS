import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface InstallAppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InstallAppDialog({ open, onOpenChange }: InstallAppDialogProps) {
  const { isInstallable, isIOS, triggerInstall, isInstalled, installPromptEvent } = usePWAInstall();

  if (!isInstallable && !isInstalled) {
    return null;
  }

  const handleConfirmInstall = async () => {
    onOpenChange(false);
    if (!isIOS && !installPromptEvent) {
      toast.info("Installation is managed by your browser. If already installed, you can open OMP from your applications. Otherwise, look for the 'Install' icon in the browser address bar.", { duration: 6000 });
      return;
    }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            onClick={() => onOpenChange(false)}
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
  );
}