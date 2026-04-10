# Deadline Countdown & Urgency Indicator Feature

## Overview

Adds a visual deadline countdown with color-coded urgency indicators to all application listings in the Event Application Tracker.

## Features

### 1. Countdown Display
- Shows days remaining until deadline
- Updates based on current date
- Handles timezone correctly
- Handles expired deadlines gracefully

### 2. Urgency Colors
```
> 7 days    → Gray     (normal)
3-7 days    → Yellow   (warning)
0-2 days    → Red      (urgent)
Expired     → Red      (expired + strikethrough)
```

### 3. Status Messages
- "5 days left"
- "2 days left"
- "1 day left"
- "Due today"
- "Deadline passed"

## Files Created

### 1. `client/src/lib/getDeadlineStatus.ts`
Helper function that calculates deadline status.

```typescript
interface DeadlineStatus {
  text: string;                     // "5 days left"
  color: 'gray' | 'yellow' | 'red'; // Urgency color
  isExpired: boolean;               // True if past deadline
  daysLeft: number;                 // Days until or after deadline
}

getDeadlineStatus(deadline?: Date | string): DeadlineStatus | null
```

### 2. `client/src/components/DeadlineBadge.tsx`
Reusable badge component for displaying deadline status.

```typescript
<DeadlineBadge 
  deadline={application.deadline} 
  showDate={true} 
/>
```

### 3. Updated Components
- `ApplicationCard.tsx` - Shows deadline badge with urgency indicator

## Usage Examples

### Basic Usage in Component

```typescript
import { DeadlineBadge } from '@/components/DeadlineBadge';

function ApplicationCard({ application }: { application: Application }) {
  return (
    <div>
      <h4>{application.eventName}</h4>
      
      {application.deadline && (
        <DeadlineBadge deadline={application.deadline} showDate={true} />
      )}
    </div>
  );
}
```

### Using the Helper Function

```typescript
import { getDeadlineStatus } from '@/lib/getDeadlineStatus';

const status = getDeadlineStatus(application.deadline);

if (status?.color === 'red') {
  // Show urgent warning
}
```

### Sorting Applications by Urgency

```typescript
import { getDeadlineStatus } from '@/lib/getDeadlineStatus';

const sorted = applications.sort((a, b) => {
  const statusA = getDeadlineStatus(a.deadline);
  const statusB = getDeadlineStatus(b.deadline);
  
  // Urgent (red) first
  const colorPriority = { red: 0, yellow: 1, gray: 2 };
  return colorPriority[statusA?.color || 'gray'] - 
         colorPriority[statusB?.color || 'gray'];
});
```

## Component Integration Points

### 1. Application Card ✅
- Shows deadline badge below event type
- Color-coded urgency indicator
- Includes date (e.g., "12 May")
- **Already integrated**

### 2. Dashboard List
To integrate, add to application list items:
```typescript
<DeadlineBadge deadline={app.deadline} showDate={true} />
```

### 3. Kanban Board
To integrate in card footer:
```typescript
<div className="border-t pt-2 mt-2">
  <DeadlineBadge deadline={application.deadline} />
</div>
```

### 4. Table View
Add deadline column:
```typescript
<table>
  <thead>
    <tr>
      {/* other columns */}
      <th>Deadline</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      {/* other cells */}
      <td>
        <DeadlineBadge deadline={application.deadline} showDate={true} />
      </td>
    </tr>
  </tbody>
</table>
```

## UI Specifications

### Badge Styling
- **Gray (>7 days)**: Light gray pill badge
- **Yellow (3-7 days)**: Yellow/amber pill badge
- **Red (0-2 days)**: Red pill badge with emphasis
- **Expired**: Red text with strikethrough

### Layout
- Positioned below event type
- Icon: ⏳ clock emoji
- Text: "{text}" (e.g., "5 days left")
- Optional date above badge (e.g., "12 May")

## Database Consideration

No database changes needed. Uses existing `deadline` field from applications table.

- Field: `applications.deadline` (DATE or TIMESTAMP)
- Format: ISO date string or Date object
- Example: `"2024-12-25"` or `new Date("2024-12-25")`

## Timezone Handling

The `getDeadlineStatus` function handles timezones correctly:
- Uses local date (start of day)
- Compares with current local date
- No UTC conversion needed

## Testing

### Test Cases

```typescript
// Test 1: Future deadline (>7 days)
getDeadlineStatus('2025-12-31')
// Returns: { text: "267 days left", color: "gray", ... }

// Test 2: Warning deadline (3-7 days)
getDeadlineStatus(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000))
// Returns: { text: "5 days left", color: "yellow", ... }

// Test 3: Urgent deadline (0-2 days)
getDeadlineStatus(new Date(Date.now() + 1 * 24 * 60 * 60 * 1000))
// Returns: { text: "1 day left", color: "red", ... }

// Test 4: Today
getDeadlineStatus(new Date())
// Returns: { text: "Due today", color: "red", ... }

// Test 5: Expired
getDeadlineStatus(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000))
// Returns: { text: "Deadline passed", color: "red", isExpired: true, ... }

// Test 6: No deadline
getDeadlineStatus(null)
// Returns: null
```

## Performance

- **Computation**: O(1) - Simple date comparison
- **Re-renders**: Only when application data changes
- **No API calls**: Pure client-side calculation

## Accessibility

- Color blind friendly (uses text + color)
- Semantic HTML with proper contrast
- Clock emoji (⏳) for visual indicator
- Screen readers read the full text (e.g., "5 days left")

## Future Enhancements

1. **Notification**: Show toast/alert for approaching deadlines
2. **Dashboard Widget**: Highlight urgent applications
3. **Email Notification**: Send reminders X days before deadline
4. **Snooze Function**: Delay deadline for applications not ready
5. **Calendar Integration**: Add deadline to exported iCal

## Files Modified

| File | Changes |
|------|---------|
| `ApplicationCard.tsx` | Added `DeadlineBadge` import and component |
| Created | `DeadlineBadge.tsx` - New badge component |
| Created | `getDeadlineStatus.ts` - Helper function |
| Created | `DEADLINE_COUNTDOWN_USAGE.ts` - Usage examples |

## No Breaking Changes

✅ All existing functionality preserved
✅ No database modifications
✅ No API changes
✅ Backward compatible
✅ Pure UI enhancement
