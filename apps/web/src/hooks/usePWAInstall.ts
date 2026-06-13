import { useState, useEffect } from "react";

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWAInstall() {
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  const isInstallable = installPromptEvent !== null && !isInstalled;

  useEffect(() => {
    console.log("PWA Status Update - installPromptEvent:", installPromptEvent, "isInstalled:", isInstalled, "isInstallable:", isInstallable);
  }, [installPromptEvent, isInstalled, isInstallable]);

  useEffect(() => {
    const checkStandalone = () => {
      return (
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true
      );
    };

    setIsInstalled(checkStandalone());

    const handleBeforeInstallPrompt = (e: Event) => {
      console.log("PWA install available");
      e.preventDefault();
      setInstallPromptEvent(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      console.log("App was installed.");
      setIsInstalled(true);
      setInstallPromptEvent(null);
    };

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsInstalled(e.matches);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    mediaQuery.addEventListener("change", handleMediaChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      mediaQuery.removeEventListener("change", handleMediaChange);
    };
  }, []);

  const triggerInstall = async (): Promise<"accepted" | "dismissed"> => {
    if (!installPromptEvent) {
      console.warn("Installation prompt is not available yet.");
      return "dismissed";
    }
    await installPromptEvent.prompt();
    const choiceResult = await installPromptEvent.userChoice;
    setInstallPromptEvent(null);
    return choiceResult.outcome;
  };

  return {
    isInstallable,
    isInstalled,
    triggerInstall,
    installPromptEvent,
  };
}
