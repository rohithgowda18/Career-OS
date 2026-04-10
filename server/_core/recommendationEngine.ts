import { invokeLLM } from "./llm";

export interface ApplicationHistory {
  eventName: string;
  eventType: "Hackathon" | "Workshop" | "Conference" | "Other";
  status: string;
  deadline: Date;
  notes?: string;
}

export interface RecommendationResult {
  eventType: string;
  reasoning: string;
  successRate: number;
  suggestedEvents: Array<{
    name: string;
    url: string;
  }>;
  bestTimeToApply: string;
  tips: string[];
}

/**
 * Analyze user's application history and generate personalized recommendations
 * using LLM to identify patterns and success factors
 */
export async function generateRecommendations(
  applications: ApplicationHistory[],
  userEmail?: string
): Promise<RecommendationResult[]> {
  if (applications.length === 0) {
    return getDefaultRecommendations();
  }

  try {
    // Prepare application history summary
    const applicationSummary = prepareApplicationSummary(applications);
    
    // Use LLM to analyze patterns and generate recommendations
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert career advisor specializing in helping developers find and apply to hackathons, workshops, and tech conferences. 
          
Analyze the user's application history and provide personalized recommendations for future events they should apply to.
Focus on:
1. Event types where they have the highest success rate
2. Optimal timing for applications based on their history
3. Specific real, existing event names with actual URLs
4. Practical tips for improving their application success rate

Return your analysis as JSON with event names and valid URLs (e.g., https://mlh.io, https://devpost.com/hackathons, etc.)

Return your analysis as JSON with the following structure:
{
  "recommendations": [
    {
      "eventType": "Hackathon|Workshop|Conference|Other",
      "reasoning": "Why this type is recommended based on their history",
      "successRate": 0-100,
      "suggestedEvents": [
        {"name": "Event name", "url": "https://example.com"},
        {"name": "Event name 2", "url": "https://example2.com"}
      ],
      "bestTimeToApply": "Month or season when they should apply",
      "tips": ["Tip 1", "Tip 2", "Tip 3"]
    }
  ]
}`,
        },
        {
          role: "user",
          content: `Here is the user's application history:

${applicationSummary}

Based on this history, provide 2-3 personalized recommendations for event types and specific events they should apply to next. Include real event URLs.`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "recommendations",
          strict: true,
          schema: {
            type: "object",
            properties: {
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    eventType: {
                      type: "string",
                      enum: ["Hackathon", "Workshop", "Conference", "Other"],
                    },
                    reasoning: { type: "string" },
                    successRate: { type: "number", minimum: 0, maximum: 100 },
                    suggestedEvents: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          url: { type: "string", format: "uri" },
                        },
                        required: ["name", "url"],
                        additionalProperties: false,
                      },
                      minItems: 1,
                      maxItems: 5,
                    },
                    bestTimeToApply: { type: "string" },
                    tips: {
                      type: "array",
                      items: { type: "string" },
                      minItems: 1,
                      maxItems: 5,
                    },
                  },
                  required: [
                    "eventType",
                    "reasoning",
                    "successRate",
                    "suggestedEvents",
                    "bestTimeToApply",
                    "tips",
                  ],
                  additionalProperties: false,
                },
              },
            },
            required: ["recommendations"],
            additionalProperties: false,
          },
        },
      },
    });

    // Parse the response
    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.warn("No content in LLM response for recommendations");
      return getDefaultRecommendations();
    }

    const parsed = typeof content === 'string' ? JSON.parse(content) : content;
    return parsed.recommendations || getDefaultRecommendations();
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return getDefaultRecommendations();
  }
}

/**
 * Prepare a summary of user's application history for LLM analysis
 */
function prepareApplicationSummary(applications: ApplicationHistory[]): string {
  // Calculate statistics
  const byType: Record<string, { total: number; accepted: number; rejected: number }> = {};
  const byMonth: Record<string, number> = {};

  applications.forEach(app => {
    // Count by type
    if (!byType[app.eventType]) {
      byType[app.eventType] = { total: 0, accepted: 0, rejected: 0 };
    }
    byType[app.eventType].total++;

    if (app.status === "Accepted") {
      byType[app.eventType].accepted++;
    } else if (app.status === "Rejected") {
      byType[app.eventType].rejected++;
    }

    // Count by month
    const month = new Date(app.deadline).toLocaleString("default", { month: "long" });
    byMonth[month] = (byMonth[month] || 0) + 1;
  });

  let summary = `Total Applications: ${applications.length}\n\n`;

  summary += "Success Rate by Event Type:\n";
  Object.entries(byType).forEach(([type, stats]) => {
    const rate = ((stats.accepted / stats.total) * 100).toFixed(1);
    summary += `- ${type}: ${stats.accepted}/${stats.total} accepted (${rate}%)\n`;
  });

  summary += "\nApplications by Deadline Month:\n";
  Object.entries(byMonth).forEach(([month, count]) => {
    summary += `- ${month}: ${count} applications\n`;
  });

  summary += "\nRecent Applications (last 5):\n";
  applications.slice(-5).forEach(app => {
    summary += `- ${app.eventName} (${app.eventType}): ${app.status}\n`;
  });

  return summary;
}

/**
 * Get default recommendations when LLM analysis fails or no history exists
 */
function getDefaultRecommendations(): RecommendationResult[] {
  return [
    {
      eventType: "Hackathon",
      reasoning:
        "Hackathons are great for building projects quickly and networking with other developers. They offer diverse opportunities for all skill levels.",
      successRate: 75,
      suggestedEvents: [
        { name: "HackMIT", url: "https://hackmit.org" },
        { name: "PennApps", url: "https://www.pennapps.com" },
        { name: "TechCrunch Disrupt Hackathon", url: "https://disrupt.techcrunch.com" },
        { name: "Hack the North", url: "https://hackthenorth.com" },
        { name: "AngelHack", url: "https://www.angelhack.com" },
      ],
      bestTimeToApply: "September - November (fall hackathons)",
      tips: [
        "Start with local hackathons to build experience",
        "Highlight past projects in your application",
        "Apply early as spots fill up quickly",
        "Consider hackathons with travel support if needed",
        "Team up with friends for better collaboration",
      ],
    },
    {
      eventType: "Conference",
      reasoning:
        "Tech conferences provide learning opportunities, industry insights, and networking with professionals. They're excellent for career growth.",
      successRate: 65,
      suggestedEvents: [
        { name: "PyCon", url: "https://www.pycon.org" },
        { name: "JSConf", url: "https://jsconf.com" },
        { name: "React Conf", url: "https://conf.reactjs.org" },
        { name: "Google I/O", url: "https://io.google/2024" },
        { name: "WWDC", url: "https://developer.apple.com/wwdc" },
      ],
      bestTimeToApply: "January - March (for spring/summer conferences)",
      tips: [
        "Apply for speaker slots if you have relevant experience",
        "Look for diversity scholarships and grants",
        "Attend virtual conferences to reduce costs",
        "Network before the event on social media",
        "Prepare questions for the sessions you plan to attend",
      ],
    },
    {
      eventType: "Workshop",
      reasoning:
        "Workshops offer hands-on learning and skill development. They're perfect for deepening expertise in specific technologies.",
      successRate: 80,
      suggestedEvents: [
        { name: "Udacity Nanodegree Programs", url: "https://www.udacity.com/nanodegree" },
        { name: "Coursera Specializations", url: "https://www.coursera.org" },
        { name: "Frontend Masters", url: "https://frontendmasters.com" },
        { name: "Egghead.io Courses", url: "https://egghead.io" },
        { name: "Pluralsight Learning Paths", url: "https://www.pluralsight.com" },
      ],
      bestTimeToApply: "Anytime (workshops typically have rolling admissions)",
      tips: [
        "Choose workshops that align with your career goals",
        "Look for certifications that boost your resume",
        "Join cohort-based workshops for community support",
        "Practice the skills learned immediately after",
        "Share your learning journey on social media",
      ],
    },
  ];
}

/**
 * Calculate success metrics from application history
 */
export function calculateSuccessMetrics(applications: ApplicationHistory[]) {
  if (applications.length === 0) {
    return {
      totalApplications: 0,
      acceptanceRate: 0,
      rejectionRate: 0,
      pendingRate: 0,
      bestEventType: null,
      worstEventType: null,
    };
  }

  const statuses = {
    accepted: applications.filter(a => a.status === "Accepted").length,
    rejected: applications.filter(a => a.status === "Rejected").length,
    pending: applications.filter(
      a =>
        a.status !== "Accepted" &&
        a.status !== "Rejected" &&
        a.status !== "Withdrawn"
    ).length,
  };

  const byType: Record<string, { total: number; accepted: number }> = {};
  applications.forEach(app => {
    if (!byType[app.eventType]) {
      byType[app.eventType] = { total: 0, accepted: 0 };
    }
    byType[app.eventType].total++;
    if (app.status === "Accepted") {
      byType[app.eventType].accepted++;
    }
  });

  const typeRates = Object.entries(byType).map(([type, stats]) => ({
    type,
    rate: stats.accepted / stats.total,
  }));

  return {
    totalApplications: applications.length,
    acceptanceRate: (statuses.accepted / applications.length) * 100,
    rejectionRate: (statuses.rejected / applications.length) * 100,
    pendingRate: (statuses.pending / applications.length) * 100,
    bestEventType: typeRates.length > 0 ? typeRates.sort((a, b) => b.rate - a.rate)[0]?.type : null,
    worstEventType: typeRates.length > 0 ? typeRates.sort((a, b) => a.rate - b.rate)[0]?.type : null,
  };
}
