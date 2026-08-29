import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Palette } from "lucide-react";

interface ThemeSelectorProps {
  currentTheme: string;
  setTheme: (themeId: string) => void;
  variant?: "icon" | "button";
  className?: string;
}

interface ThemeOption {
  id: string;
  label: string;
  color: string;
  isTerminal?: boolean;
}

const themeOptions: ThemeOption[] = [
  { id: "glass", label: "Glass (VisionOS)", color: "bg-violet-500" },
  { id: "cyberpunk", label: "Cyberpunk", color: "bg-yellow-400" },
  { id: "brutalist", label: "Neo Brutalist", color: "bg-emerald-400" },
  { id: "terminal", label: "Retro Terminal", color: "bg-green-500", isTerminal: true },
  { id: "claymorphism", label: "Claymorphism", color: "bg-pink-400" },
];

export default function ThemeSelector({ currentTheme, setTheme, variant = "button", className = "" }: ThemeSelectorProps) {
  const triggerContent = variant === "icon" ? (
    <Button
      variant="ghost"
      size="icon"
      className={cn("h-8 w-8 hover:bg-bg-elevated", className)}
      title="Change Theme"
    >
      <Palette className="w-4 h-4" />
    </Button>
  ) : (
    <Button
      variant="outline"
      className={cn("bg-bg-elevated/40 hover:bg-bg-elevated text-text-muted hover:text-text-main bg-bg-elevated/40 cursor-pointer", className)}
      title="Change Theme"
    >
      <Palette className="w-4 h-4" />
    </Button>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {triggerContent}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-bg-card border-border text-text-main mt-1">
        <div className="px-2.5 py-1.5 border-b border-border">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-dim">Choose Theme</p>
        </div>
        <div className="p-1 space-y-0.5">
          {themeOptions.map((theme) => (
            <DropdownMenuItem
              key={theme.id}
              onClick={() => setTheme(theme.id)}
              className={cn(
                "cursor-pointer rounded-md px-2.5 py-1.5 text-xs font-medium flex items-center justify-between",
                currentTheme === theme.id && "bg-primary/10 text-primary"
              )}
            >
              <span>{theme.label}</span>
              {theme.isTerminal ? (
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 border border-white/20 font-mono text-[9px] flex items-center justify-center text-black">{"$>"}</span>
              ) : (
                <span className="w-2.5 h-2.5 rounded-full border border-white/20" style={{ backgroundColor: theme.color.replace("bg-", "") }} />
              )}
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}