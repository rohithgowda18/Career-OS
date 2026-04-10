/**
 * Deadline Status Helper
 * Calculates deadline countdown and urgency indicator
 */

export interface DeadlineStatus {
  text: string;
  color: 'gray' | 'yellow' | 'red';
  isExpired: boolean;
  daysLeft: number;
}

/**
 * Get deadline status with countdown and urgency color
 * @param deadline - Deadline date (Date object or ISO string)
 * @returns DeadlineStatus object or null if no deadline
 */
export function getDeadlineStatus(deadline: Date | string | null | undefined): DeadlineStatus | null {
  if (!deadline) {
    return null;
  }

  try {
    // Parse deadline to Date object
    const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;

    // Validate date
    if (isNaN(deadlineDate.getTime())) {
      return null;
    }

    // Get current date (start of day for fair comparison)
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const deadlineStart = new Date(
      deadlineDate.getFullYear(),
      deadlineDate.getMonth(),
      deadlineDate.getDate()
    );

    // Calculate days difference
    const timeDiff = deadlineStart.getTime() - todayStart.getTime();
    const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    // Determine status
    let text = '';
    let color: 'gray' | 'yellow' | 'red' = 'gray';
    let isExpired = false;

    if (daysLeft < 0) {
      // Past deadline
      text = 'Deadline passed';
      color = 'red';
      isExpired = true;
    } else if (daysLeft === 0) {
      // Due today
      text = 'Due today';
      color = 'red';
    } else if (daysLeft === 1) {
      // Tomorrow
      text = '1 day left';
      color = 'red';
    } else if (daysLeft <= 2) {
      // 2 days
      text = `${daysLeft} days left`;
      color = 'red';
    } else if (daysLeft <= 7) {
      // 3-7 days
      text = `${daysLeft} days left`;
      color = 'yellow';
    } else {
      // More than 7 days
      text = `${daysLeft} days left`;
      color = 'gray';
    }

    return {
      text,
      color,
      isExpired,
      daysLeft,
    };
  } catch (error) {
    console.error('Error calculating deadline status:', error);
    return null;
  }
}

/**
 * Format deadline date for display
 * @param deadline - Deadline date
 * @returns Formatted date string (e.g., "12 May")
 */
export function formatDeadlineDate(deadline: Date | string | null | undefined): string | null {
  if (!deadline) {
    return null;
  }

  try {
    const date = typeof deadline === 'string' ? new Date(deadline) : deadline;
    
    if (isNaN(date.getTime())) {
      return null;
    }

    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
    };

    return date.toLocaleDateString('en-US', options);
  } catch (error) {
    console.error('Error formatting deadline date:', error);
    return null;
  }
}
