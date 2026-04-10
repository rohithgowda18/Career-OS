import { sendEmailNotification, generateStatusChangeEmail, generateDeadlineReminderEmail } from "./_core/emailService";
import { createNotification, getUserPreferences } from "./db";
import { User } from "../shared/db-types";

/**
 * Handle application status change and send notifications
 */
export async function handleApplicationStatusChange(
  user: User,
  applicationId: number,
  eventName: string,
  eventType: string,
  oldStatus: string,
  newStatus: string
) {
  try {
    // Check user preferences
    const prefs = await getUserPreferences(user.id);
    if (!prefs?.emailNotificationsEnabled || !prefs?.emailStatusUpdates) {
      return;
    }

    if (!user.email) {
      console.warn(`[Notifications] User ${user.id} has no email address`);
      return;
    }

    // Create notification record
    await createNotification({
      userId: user.id,
      applicationId,
      type: "status_change",
      subject: `Application Status Updated: ${eventName}`,
      message: `Your ${eventName} application status has changed from ${oldStatus} to ${newStatus}.`,
      sent: 0,
    });

    // Send email
    const htmlContent = generateStatusChangeEmail(eventName, oldStatus, newStatus, eventType);
    const result = await sendEmailNotification({
      to: user.email,
      subject: `Application Status Updated: ${eventName}`,
      message: `Your ${eventName} application status has changed from ${oldStatus} to ${newStatus}.`,
      html: htmlContent,
    });

    if (result.success) {
      console.log(`[Notifications] Status change email sent to ${user.email}`);
    } else {
      console.error(`[Notifications] Failed to send status change email: ${result.error}`);
    }
  } catch (error) {
    console.error("[Notifications] Error handling status change:", error);
  }
}

/**
 * Handle upcoming deadline reminder
 */
export async function handleUpcomingDeadlineReminder(
  user: User,
  applicationId: number,
  eventName: string,
  eventType: string,
  deadline: Date
) {
  try {
    // Check user preferences
    const prefs = await getUserPreferences(user.id);
    if (!prefs?.emailNotificationsEnabled || !prefs?.emailDeadlineReminders) {
      return;
    }

    if (!user.email) {
      console.warn(`[Notifications] User ${user.id} has no email address`);
      return;
    }

    // Calculate days until deadline
    const now = new Date();
    const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Create notification record
    await createNotification({
      userId: user.id,
      applicationId,
      type: "upcoming_deadline",
      subject: `Deadline Reminder: ${eventName}`,
      message: `Your ${eventName} application deadline is in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}.`,
      sent: 0,
    });

    // Send email
    const htmlContent = generateDeadlineReminderEmail(eventName, deadline, daysUntil, eventType);
    const result = await sendEmailNotification({
      to: user.email,
      subject: `Deadline Reminder: ${eventName}`,
      message: `Your ${eventName} application deadline is in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}.`,
      html: htmlContent,
    });

    if (result.success) {
      console.log(`[Notifications] Deadline reminder email sent to ${user.email}`);
    } else {
      console.error(`[Notifications] Failed to send deadline reminder email: ${result.error}`);
    }
  } catch (error) {
    console.error("[Notifications] Error handling deadline reminder:", error);
  }
}
