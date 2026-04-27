/**
 * Deadline Countdown & Urgency Indicator - Usage Examples
 * 
 * This file demonstrates how to use the deadline status utilities
 * in different parts of the application.
 */

import { getDeadlineStatus, formatDeadlineDate } from '@/lib/getDeadlineStatus';
import { DeadlineBadge } from '@/components/DeadlineBadge';
import { Application } from '@/types/types';

// ============================================
// Example 1: Using the helper function
// ============================================

const exampleDeadline = new Date('2024-12-25');

const status = getDeadlineStatus(exampleDeadline);

if (status) {
  console.log(`Text: ${status.text}`);        // "5 days left"
  console.log(`Color: ${status.color}`);      // "yellow" | "red" | "gray"
  console.log(`Expired: ${status.isExpired}`);  // false
  console.log(`Days Left: ${status.daysLeft}`); // 5
}

// ============================================
// Example 2: Using in ApplicationCard (React Component)
// ============================================

function ApplicationCardExample({ application }: { application: Application }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h4 className="font-semibold mb-2">{application.eventName}</h4>
      
      <div className="space-y-2 mb-3">
        <p className="text-xs text-muted-foreground">{application.eventType}</p>
        
        {/* Show deadline with countdown badge */}
        {application.deadline && (
          <DeadlineBadge deadline={application.deadline} showDate={true} />
        )}
      </div>
      
      <p className="text-xs text-muted-foreground">{application.notes}</p>
    </div>
  );
}

// ============================================
// Example 3: Conditional rendering based on urgency
// ============================================

function DeadlineWarning({ application }: { application: Application }) {
  const status = getDeadlineStatus(application.deadline);

  if (!status) return null;

  // Show prominent warning for urgent or expired deadlines
  if (status.color === 'red') {
    return (
      <div className="bg-red-50 border border-red-200 p-3 rounded-md">
        <p className="text-sm font-semibold text-red-600">
          ⚠️ {status.text}
        </p>
        <p className="text-xs text-red-600 mt-1">
          {status.isExpired 
            ? "This application deadline has passed." 
            : "Act quickly to submit your application!"}
        </p>
      </div>
    );
  }

  return null;
}

// ============================================
// Example 4: Date formatting
// ============================================

function DeadlineDisplay({ deadline }: { deadline: Date | string }) {
  const formattedDate = formatDeadlineDate(deadline);
  
  return (
    <div>
      <p className="text-sm">Deadline: {formattedDate}</p>
      {/* Output: "Deadline: 12 May" */}
    </div>
  );
}

// ============================================
// Example 5: Color utility for styling
// ============================================

function StatusPill({ application }: { application: Application }) {
  const status = getDeadlineStatus(application.deadline);

  if (!status) return null;

  const colorClasses = {
    gray: 'bg-gray-100 text-gray-700 border-gray-300',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    red: 'bg-red-100 text-red-700 border-red-300',
  };

  return (
    <div className={`px-2 py-1 rounded-full border text-xs font-medium ${colorClasses[status.color]}`}>
      {status.text}
    </div>
  );
}

// ============================================
// Example 6: Sorting by deadline urgency
// ============================================

function sortByUrgency(applications: Application[]) {
  return applications.sort((a, b) => {
    const statusA = getDeadlineStatus(a.deadline);
    const statusB = getDeadlineStatus(b.deadline);

    // No deadline goes to bottom
    if (!statusA) return 1;
    if (!statusB) return -1;

    // Urgent (red) first
    const colorPriority = { red: 0, yellow: 1, gray: 2 };
    const priorityDiff = colorPriority[statusA.color] - colorPriority[statusB.color];
    
    if (priorityDiff !== 0) return priorityDiff;

    // Within same color, earlier deadline first
    return statusA.daysLeft - statusB.daysLeft;
  });
}

// ============================================
// Usage in different components
// ============================================

/**
 * For Dashboard Summary:
 * Show number of urgent applications
 */
function getUrgentCount(applications: Application[]): number {
  return applications.filter(app => {
    const status = getDeadlineStatus(app.deadline);
    return status?.color === 'red';
  }).length;
}

/**
 * For Kanban Board:
 * Show deadline in card footer
 */
function KanbanCard({ application }: { application: Application }) {
  return (
    <div className="bg-white rounded-lg p-3 border border-gray-200">
      <h5 className="font-semibold text-sm mb-2">{application.eventName}</h5>
      
      {/* Footer with deadline */}
      <div className="border-t pt-2 mt-2">
        {application.deadline ? (
          <DeadlineBadge deadline={application.deadline} />
        ) : (
          <p className="text-xs text-gray-400">No deadline</p>
        )}
      </div>
    </div>
  );
}

/**
 * For Table View:
 * Add deadline column
 */
function DeadlineTableCell({ deadline }: { deadline?: Date | string }) {
  if (!deadline) return <td className="px-4 py-2 text-xs text-gray-400">—</td>;

  const status = getDeadlineStatus(deadline);
  if (!status) return <td className="px-4 py-2 text-xs text-gray-400">—</td>;

  return (
    <td className="px-4 py-2">
      <DeadlineBadge deadline={deadline} showDate={true} />
    </td>
  );
}

// ============================================
// Export all examples
// ============================================

export {
  ApplicationCardExample,
  DeadlineWarning,
  DeadlineDisplay,
  StatusPill,
  sortByUrgency,
  getUrgentCount,
  KanbanCard,
  DeadlineTableCell,
};
