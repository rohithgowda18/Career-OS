import { describe, it, expect } from "vitest";
import { generateRecommendations, calculateSuccessMetrics } from "./_core/recommendationEngine";

describe("Recommendations Engine", () => {
  describe("calculateSuccessMetrics", () => {
    it("should calculate success metrics for applications", () => {
      const applications = [
        {
          eventName: "HackMIT",
          eventType: "Hackathon" as const,
          status: "Accepted" as const,
          deadline: new Date("2026-05-01"),
          notes: "Great experience",
        },
        {
          eventName: "ReactConf",
          eventType: "Conference" as const,
          status: "Rejected" as const,
          deadline: new Date("2026-06-01"),
          notes: undefined,
        },
        {
          eventName: "Web Dev Workshop",
          eventType: "Workshop" as const,
          status: "Accepted" as const,
          deadline: new Date("2026-07-01"),
          notes: "Learned a lot",
        },
      ];

      const metrics = calculateSuccessMetrics(applications);

      expect(metrics).toBeDefined();
      expect(metrics.totalApplications).toBe(3);
      expect(metrics.acceptanceRate).toBeCloseTo(66.67, 1);
      expect(metrics.rejectionRate).toBeCloseTo(33.33, 1);
    });

    it("should handle empty applications array", () => {
      const metrics = calculateSuccessMetrics([]);

      expect(metrics.totalApplications).toBe(0);
      expect(metrics.acceptanceRate).toBe(0);
      expect(metrics.rejectionRate).toBe(0);
      expect(metrics.bestEventType).toBeNull();
      expect(metrics.worstEventType).toBeNull();
    });

    it("should identify best and worst event types", () => {
      const applications = [
        {
          eventName: "HackMIT",
          eventType: "Hackathon" as const,
          status: "Accepted" as const,
          deadline: new Date("2026-05-01"),
          notes: undefined,
        },
        {
          eventName: "HackNYU",
          eventType: "Hackathon" as const,
          status: "Accepted" as const,
          deadline: new Date("2026-06-01"),
          notes: undefined,
        },
        {
          eventName: "ReactConf",
          eventType: "Conference" as const,
          status: "Rejected" as const,
          deadline: new Date("2026-07-01"),
          notes: undefined,
        },
      ];

      const metrics = calculateSuccessMetrics(applications);

      expect(metrics.bestEventType).toBe("Hackathon");
      expect(metrics.worstEventType).toBe("Conference");
      expect(metrics.totalApplications).toBe(3);
    });

    it("should calculate pending rate correctly", () => {
      const applications = [
        {
          eventName: "Event 1",
          eventType: "Hackathon" as const,
          status: "Accepted" as const,
          deadline: new Date("2026-05-01"),
          notes: undefined,
        },
        {
          eventName: "Event 2",
          eventType: "Hackathon" as const,
          status: "Applied" as const,
          deadline: new Date("2026-06-01"),
          notes: undefined,
        },
        {
          eventName: "Event 3",
          eventType: "Workshop" as const,
          status: "Under Review" as const,
          deadline: new Date("2026-07-01"),
          notes: undefined,
        },
      ];

      const metrics = calculateSuccessMetrics(applications);

      expect(metrics.totalApplications).toBe(3);
      expect(metrics.acceptanceRate).toBeCloseTo(33.33, 1);
      expect(metrics.pendingRate).toBeCloseTo(66.67, 1);
    });
  });

  describe("generateRecommendations", () => {
    it("should generate recommendations for users with application history", async () => {
      const applications = [
        {
          eventName: "HackMIT",
          eventType: "Hackathon" as const,
          status: "Accepted" as const,
          deadline: new Date("2026-05-01"),
          notes: "Great experience",
        },
        {
          eventName: "HackNYU",
          eventType: "Hackathon" as const,
          status: "Accepted" as const,
          deadline: new Date("2026-06-01"),
          notes: undefined,
        },
        {
          eventName: "ReactConf",
          eventType: "Conference" as const,
          status: "Rejected" as const,
          deadline: new Date("2026-07-01"),
          notes: undefined,
        },
      ];

      const recommendations = await generateRecommendations(applications);

      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);

      // Check structure of recommendations
      recommendations.forEach((rec) => {
        expect(rec).toHaveProperty("eventType");
        expect(rec).toHaveProperty("reasoning");
        expect(rec).toHaveProperty("successRate");
        expect(rec).toHaveProperty("suggestedEvents");
        expect(rec).toHaveProperty("bestTimeToApply");
        expect(rec).toHaveProperty("tips");

        expect(typeof rec.eventType).toBe("string");
        expect(typeof rec.reasoning).toBe("string");
        expect(typeof rec.successRate).toBe("number");
        expect(Array.isArray(rec.suggestedEvents)).toBe(true);
        expect(typeof rec.bestTimeToApply).toBe("string");
        expect(Array.isArray(rec.tips)).toBe(true);

        // Validate success rate is between 0-100
        expect(rec.successRate).toBeGreaterThanOrEqual(0);
        expect(rec.successRate).toBeLessThanOrEqual(100);

        // Validate suggested events have name and url
        rec.suggestedEvents.forEach((event: any) => {
          expect(event).toHaveProperty("name");
          expect(event).toHaveProperty("url");
          expect(typeof event.name).toBe("string");
          expect(typeof event.url).toBe("string");
        });

        // Validate arrays have content
        expect(rec.suggestedEvents.length).toBeGreaterThan(0);
        expect(rec.tips.length).toBeGreaterThan(0);
      });
    });

    it("should return default recommendations for users with no history", async () => {
      const recommendations = await generateRecommendations([]);

      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);

      // Should return default recommendations
      recommendations.forEach((rec) => {
        expect(rec).toHaveProperty("eventType");
        expect(rec).toHaveProperty("reasoning");
        expect(rec).toHaveProperty("successRate");
      });
    });

    it("should handle applications with mixed statuses", async () => {
      const applications = [
        {
          eventName: "Event 1",
          eventType: "Hackathon" as const,
          status: "Accepted" as const,
          deadline: new Date("2026-05-01"),
          notes: undefined,
        },
        {
          eventName: "Event 2",
          eventType: "Hackathon" as const,
          status: "Rejected" as const,
          deadline: new Date("2026-06-01"),
          notes: undefined,
        },
        {
          eventName: "Event 3",
          eventType: "Workshop" as const,
          status: "Applied" as const,
          deadline: new Date("2026-07-01"),
          notes: undefined,
        },
        {
          eventName: "Event 4",
          eventType: "Conference" as const,
          status: "Interested" as const,
          deadline: new Date("2026-08-01"),
          notes: undefined,
        },
      ];

      const recommendations = await generateRecommendations(applications);

      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
    });
  });
});
