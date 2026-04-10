import { sendEmailNotification } from "./emailService";
import type { Application, User } from "../../shared/db-types";

export interface DigestContent {
  subject: string;
  htmlContent: string;
  textContent: string;
  summary: {
    totalApplications: number;
    acceptedCount: number;
    upcomingDeadlines: number;
    underReviewCount: number;
  };
}

export async function generateWeeklyDigest(
  user: User,
  applications: Application[]
): Promise<DigestContent> {
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Calculate metrics
  const totalApplications = applications.length;
  const acceptedCount = applications.filter((a) => a.status === "Accepted").length;
  const rejectedCount = applications.filter((a) => a.status === "Rejected").length;
  const underReviewCount = applications.filter(
    (a) => a.status === "Under Review"
  ).length;
  const interestedCount = applications.filter(
    (a) => a.status === "Interested"
  ).length;
  const appliedCount = applications.filter((a) => a.status === "Applied").length;

  // Find upcoming deadlines (next 7 days)
  const upcomingDeadlines = applications.filter((a) => {
    if (!a.deadline) return false;
    const deadline = new Date(a.deadline);
    return deadline >= now && deadline <= nextWeek;
  });

  // Group by status
  const statusBreakdown = {
    Interested: interestedCount,
    Applied: appliedCount,
    "Under Review": underReviewCount,
    Accepted: acceptedCount,
    Rejected: rejectedCount,
    Withdrawn: applications.filter((a) => a.status === "Withdrawn").length,
  };

  // Calculate acceptance rate
  const acceptanceRate =
    totalApplications > 0
      ? Math.round((acceptedCount / totalApplications) * 100)
      : 0;

  // Generate HTML content
  const htmlContent = generateHTMLDigest(
    user,
    totalApplications,
    acceptanceRate,
    statusBreakdown,
    upcomingDeadlines,
    applications
  );

  // Generate text content
  const textContent = generateTextDigest(
    user,
    totalApplications,
    acceptanceRate,
    statusBreakdown,
    upcomingDeadlines,
    applications
  );

  const subject = `Weekly Application Digest - ${totalApplications} Applications, ${acceptanceRate}% Acceptance Rate`;

  return {
    subject,
    htmlContent,
    textContent,
    summary: {
      totalApplications,
      acceptedCount,
      upcomingDeadlines: upcomingDeadlines.length,
      underReviewCount,
    },
  };
}

function generateHTMLDigest(
  user: User,
  totalApplications: number,
  acceptanceRate: number,
  statusBreakdown: Record<string, number>,
  upcomingDeadlines: Application[],
  allApplications: Application[]
): string {
  const userName = user.name || "User";
  const upcomingList = upcomingDeadlines
    .sort((a, b) => (a.deadline?.getTime() || 0) - (b.deadline?.getTime() || 0))
    .map(
      (app) =>
        `<tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            <strong>${app.eventName}</strong>
            <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
              ${app.eventType} • ${app.status}
            </div>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #d97706; font-weight: 500;">
            ${formatDate(app.deadline || undefined)}
          </td>
        </tr>`
    )
    .join("");

  const recentActivity = allApplications
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 5)
    .map(
      (app) =>
        `<div style="padding: 12px; border-left: 3px solid #3b82f6; margin-bottom: 8px; background-color: #f0f9ff;">
          <div style="font-weight: 500; color: #1f2937;">${app.eventName}</div>
          <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
            Status: <strong>${app.status}</strong> • ${formatDate(app.updatedAt)}
          </div>
        </div>`
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 20px 0; }
        .stat-card { background: #f3f4f6; padding: 16px; border-radius: 8px; text-align: center; }
        .stat-number { font-size: 28px; font-weight: bold; color: #3b82f6; }
        .stat-label { font-size: 12px; color: #6b7280; margin-top: 4px; }
        .section { margin: 24px 0; }
        .section-title { font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 12px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
        .table { width: 100%; border-collapse: collapse; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
        .cta-button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; margin: 12px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Weekly Application Digest</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9;">Week of ${formatDate(new Date())}</p>
        </div>

        <div style="background: white; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
          <p>Hi ${userName},</p>
          <p>Here's your weekly summary of application progress:</p>

          <div class="stats">
            <div class="stat-card">
              <div class="stat-number">${totalApplications}</div>
              <div class="stat-label">Total Applications</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${acceptanceRate}%</div>
              <div class="stat-label">Acceptance Rate</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${statusBreakdown.Accepted}</div>
              <div class="stat-label">Accepted</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${statusBreakdown["Under Review"]}</div>
              <div class="stat-label">Under Review</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">📅 Upcoming Deadlines (Next 7 Days)</div>
            ${
              upcomingDeadlines.length > 0
                ? `<table class="table">${upcomingList}</table>`
                : '<p style="color: #6b7280; font-size: 14px;">No upcoming deadlines this week</p>'
            }
          </div>

          <div class="section">
            <div class="section-title">📋 Status Breakdown</div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
              ${Object.entries(statusBreakdown)
                .map(
                  ([status, count]) =>
                    `<div style="padding: 12px; background: #f9fafb; border-radius: 6px;">
                      <div style="font-weight: 500; color: #1f2937;">${status}</div>
                      <div style="font-size: 20px; font-weight: bold; color: #3b82f6; margin-top: 4px;">${count}</div>
                    </div>`
                )
                .join("")}
            </div>
          </div>

          <div class="section">
            <div class="section-title">🔄 Recent Activity</div>
            ${recentActivity}
          </div>

          <div style="text-align: center; margin: 24px 0;">
            <a href="https://event-tracker.manus.space" class="cta-button">View Full Dashboard</a>
          </div>
        </div>

        <div class="footer">
          <p style="margin: 0;">Event Application Tracker</p>
          <p style="margin: 8px 0 0 0;">You're receiving this because you have weekly digest emails enabled.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateTextDigest(
  user: User,
  totalApplications: number,
  acceptanceRate: number,
  statusBreakdown: Record<string, number>,
  upcomingDeadlines: Application[],
  allApplications: Application[]
): string {
  const userName = user.name || "User";
  const separator = "=".repeat(60);

  let text = `${separator}\nWEEKLY APPLICATION DIGEST\n${separator}\n\n`;
  text += `Hi ${userName},\n\nHere's your weekly summary:\n\n`;

  text += `SUMMARY STATISTICS\n${"-".repeat(60)}\n`;
  text += `Total Applications: ${totalApplications}\n`;
  text += `Acceptance Rate: ${acceptanceRate}%\n`;
  text += `Accepted: ${statusBreakdown.Accepted}\n`;
  text += `Under Review: ${statusBreakdown["Under Review"]}\n\n`;

  if (upcomingDeadlines.length > 0) {
    text += `UPCOMING DEADLINES (Next 7 Days)\n${"-".repeat(60)}\n`;
    upcomingDeadlines
      .sort((a, b) => (a.deadline?.getTime() || 0) - (b.deadline?.getTime() || 0))
      .forEach((app) => {
        text += `• ${app.eventName}\n`;
        text += `  Type: ${app.eventType} | Status: ${app.status}\n`;
        text += `  Deadline: ${formatDate(app.deadline || undefined)}\n\n`;
      });
  }

  text += `STATUS BREAKDOWN\n${"-".repeat(60)}\n`;
  Object.entries(statusBreakdown).forEach(([status, count]) => {
    text += `${status}: ${count}\n`;
  });

  text += `\nRECENT ACTIVITY\n${"-".repeat(60)}\n`;
  allApplications
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 5)
    .forEach((app) => {
      text += `• ${app.eventName}\n`;
      text += `  Status: ${app.status} | Updated: ${formatDate(app.updatedAt)}\n\n`;
    });

  text += `${separator}\n`;
  text += `View your full dashboard: https://event-tracker.manus.space\n`;
  text += `${separator}\n`;

  return text;
}

function formatDate(date?: Date | null): string {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export async function sendWeeklyDigest(
  user: User,
  digest: DigestContent
): Promise<boolean> {
  try {
    if (!user.email) {
      console.warn(`[Digest] User ${user.id} has no email address`);
      return false;
    }

    const result = await sendEmailNotification({
      to: user.email,
      subject: digest.subject,
      message: digest.textContent,
      html: digest.htmlContent,
    });

    if (result.success) {
      console.log(`[Digest] Weekly digest sent to ${user.email}`);
      return true;
    } else {
      console.error(`[Digest] Failed to send digest to ${user.email}:`, result.error);
      return false;
    }
  } catch (error) {
    console.error(`[Digest] Failed to send digest to ${user.email}:`, error);
    return false;
  }
}
