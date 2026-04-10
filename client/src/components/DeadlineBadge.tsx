import { Badge } from "@/components/ui/badge";
import { getDeadlineStatus, formatDeadlineDate } from "@/lib/getDeadlineStatus";

interface DeadlineBadgeProps {
  deadline?: Date | string | null;
  showDate?: boolean;
}

/**
 * Reusable deadline countdown badge with urgency indicator
 */
export function DeadlineBadge({ deadline, showDate = false }: DeadlineBadgeProps) {
  if (!deadline) {
    return null;
  }

  const status = getDeadlineStatus(deadline);

  if (!status) {
    return null;
  }

  // Determine badge styling based on urgency color
  const badgeVariant = status.color === 'red' 
    ? 'destructive' 
    : status.color === 'yellow'
    ? 'secondary'
    : 'outline';

  // Apply strikethrough for expired deadlines
  const textClassName = status.isExpired ? 'line-through opacity-60' : '';

  const formattedDate = showDate ? formatDeadlineDate(deadline) : null;

  return (
    <div className="flex flex-col gap-1">
      {formattedDate && (
        <span className="text-xs text-gray-600">
          {formattedDate}
        </span>
      )}
      <Badge variant={badgeVariant} className={`text-xs font-medium whitespace-nowrap ${textClassName}`}>
        ⏳ {status.text}
      </Badge>
    </div>
  );
}
