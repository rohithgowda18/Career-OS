import { invokeLLM } from "./llm";

/**
 * Email notification service using Manus built-in email capabilities
 */

export interface EmailNotification {
  to: string;
  subject: string;
  message: string;
  html?: string;
}

/**
 * Send an email notification
 * Uses the Manus notification system to deliver emails
 */
export async function sendEmailNotification(
  notification: EmailNotification
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Use the Manus notification API via the built-in forge API
    const response = await fetch(
      `${process.env.BUILT_IN_FORGE_API_URL}/notification/send-email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.BUILT_IN_FORGE_API_KEY}`,
        },
        body: JSON.stringify({
          to: notification.to,
          subject: notification.subject,
          text: notification.message,
          html: notification.html || `<p>${escapeHtml(notification.message)}</p>`,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("[Email] Failed to send email:", error);
      return { success: false, error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    return { success: true, messageId: data.messageId };
  } catch (error) {
    console.error("[Email] Error sending notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Generate HTML email for status change notification
 */
export function generateStatusChangeEmail(
  eventName: string,
  oldStatus: string,
  newStatus: string,
  eventType: string
): string {
  const statusColors: Record<string, string> = {
    Interested: "#3b82f6",
    Applied: "#8b5cf6",
    "Under Review": "#f59e0b",
    Accepted: "#10b981",
    Rejected: "#ef4444",
    Withdrawn: "#6b7280",
  };

  const oldColor = statusColors[oldStatus] || "#6b7280";
  const newColor = statusColors[newStatus] || "#6b7280";

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1f2937; margin-bottom: 20px;">Application Status Updated</h2>
      
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Event</p>
        <p style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px; font-weight: 600;">${escapeHtml(eventName)}</p>
        
        <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Event Type</p>
        <p style="margin: 0 0 15px 0; color: #1f2937; font-size: 16px;">${escapeHtml(eventType)}</p>
        
        <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Status Change</p>
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="background-color: ${oldColor}; color: white; padding: 6px 12px; border-radius: 4px; font-size: 14px; font-weight: 500;">${escapeHtml(oldStatus)}</span>
          <span style="color: #9ca3af;">→</span>
          <span style="background-color: ${newColor}; color: white; padding: 6px 12px; border-radius: 4px; font-size: 14px; font-weight: 500;">${escapeHtml(newStatus)}</span>
        </div>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
        Log in to Event Tracker to view more details about your application.
      </p>
    </div>
  `;
}

/**
 * Generate HTML email for deadline reminder
 */
export function generateDeadlineReminderEmail(
  eventName: string,
  deadline: Date,
  daysUntil: number,
  eventType: string
): string {
  const formattedDate = deadline.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const urgencyColor = daysUntil <= 3 ? "#ef4444" : daysUntil <= 7 ? "#f59e0b" : "#3b82f6";
  const urgencyText = daysUntil <= 3 ? "Urgent" : daysUntil <= 7 ? "Coming Soon" : "Upcoming";

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1f2937; margin-bottom: 20px;">Application Deadline Reminder</h2>
      
      <div style="background-color: ${urgencyColor}15; border-left: 4px solid ${urgencyColor}; padding: 20px; margin-bottom: 20px; border-radius: 4px;">
        <p style="margin: 0 0 10px 0; color: ${urgencyColor}; font-size: 14px; font-weight: 600;">${urgencyText}</p>
        <p style="margin: 0; color: #1f2937; font-size: 18px; font-weight: 600;">${escapeHtml(eventName)}</p>
      </div>
      
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Deadline</p>
        <p style="margin: 0 0 15px 0; color: #1f2937; font-size: 16px; font-weight: 600;">${formattedDate}</p>
        
        <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Event Type</p>
        <p style="margin: 0; color: #1f2937; font-size: 16px;">${escapeHtml(eventType)}</p>
      </div>
      
      <div style="background-color: #f0fdf4; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
        <p style="margin: 0; color: #166534; font-size: 14px;">
          <strong>Days remaining:</strong> ${daysUntil} day${daysUntil !== 1 ? "s" : ""}
        </p>
      </div>
      
      <p style="color: #6b7280; font-size: 14px;">
        Don't miss this opportunity! Log in to Event Tracker to update your application status or add notes.
      </p>
    </div>
  `;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}
