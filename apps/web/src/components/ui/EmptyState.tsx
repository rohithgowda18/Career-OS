import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  title,
  description,
  icon: Icon,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-border rounded-xl bg-bg-card/20 animate-in fade-in duration-300">
      <div className="w-10 h-10 rounded-lg bg-bg-elevated/45 border border-border flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-text-dim" />
      </div>
      <h4 className="text-xs font-semibold text-text-main uppercase tracking-wider">{title}</h4>
      <p className="text-[11px] text-text-dim max-w-xs leading-relaxed mt-1">{description}</p>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="mt-4 bg-primary/10 border border-primary/20 hover:bg-primary/15 text-primary text-[11px] font-semibold h-8 rounded-lg cursor-pointer"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
