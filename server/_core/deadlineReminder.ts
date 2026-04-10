import { getPool, getUpcomingApplicationsWithUsers } from "../db";
import { handleUpcomingDeadlineReminder } from "../notificationHandlers";

/**
 * Scheduled job to check for upcoming deadlines and send reminders
 * Should be called periodically (e.g., every 6 hours or daily)
 */
export async function checkAndSendDeadlineReminders() {
  console.log("[DeadlineReminder] Starting deadline reminder check...");
  
  try {
    const pool = await getPool();
    if (!pool) {
      console.warn("[DeadlineReminder] Database not available");
      return;
    }

    // Use the optimized join query from db.ts
    const upcomingApplications = await getUpcomingApplicationsWithUsers();

    console.log(`[DeadlineReminder] Found ${upcomingApplications.length} applications with upcoming deadlines`);

    // Process each application
    for (const record of upcomingApplications) {
      const { app, user, prefs } = record;

      // Skip if user has disabled email notifications
      if (!prefs?.emailNotificationsEnabled || !prefs?.emailDeadlineReminders) {
        continue;
      }

      // Check if we already sent a reminder for this application
      const existingReminderQuery = `
        SELECT id FROM notifications 
        WHERE user_id = $1 AND application_id = $2 AND type = 'upcoming_deadline' AND sent = 1
        LIMIT 1
      `;
      const existingReminder = await pool.query(existingReminderQuery, [user.id, app.id]);

      // Only send one reminder per application
      if (existingReminder.rows.length > 0) {
        console.log(`[DeadlineReminder] Reminder already sent for app ${app.id}`);
        continue;
      }

      // Send the reminder
      await handleUpcomingDeadlineReminder(
        {
          id: user.id,
          openId: user.openId,
          name: user.name,
          email: user.email,
          role: user.role as 'user' | 'admin'
        } as any, // Cast to any to avoid strict type mismatch with NotificationHandler expectation if it expects User interface
        app.id,
        app.eventName,
        app.eventType,
        app.deadline!
      );
    }

    console.log("[DeadlineReminder] Deadline reminder check completed");
  } catch (error) {
    console.error("[DeadlineReminder] Error checking deadlines:", error);
  }
}

/**
 * Initialize deadline reminder job
 */
export function initializeDeadlineReminderJob() {
  // Run immediately on startup
  checkAndSendDeadlineReminders().catch(err => 
    console.error("[DeadlineReminder] Initial check failed:", err)
  );

  // Run every 6 hours
  const intervalId = setInterval(() => {
    checkAndSendDeadlineReminders().catch(err =>
      console.error("[DeadlineReminder] Scheduled check failed:", err)
    );
  }, 6 * 60 * 60 * 1000);

  console.log("[DeadlineReminder] Job initialized - will run every 6 hours");

  return intervalId;
}
