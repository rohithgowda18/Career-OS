import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { User } from "../shared/db-types";

function createAuthContext(): { ctx: TrpcContext; user: User } {
  const user: User = {
    id: 1,
    openId: "analytics-test-user",
    email: "analytics@test.com",
    name: "Analytics Test",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx, user };
}

describe("analytics router", () => {
  describe("acceptanceRates", () => {
    it("should return acceptance rates for all event types", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.analytics.acceptanceRates();

      expect(result).toHaveProperty("Hackathon");
      expect(result).toHaveProperty("Workshop");
      expect(result).toHaveProperty("Conference");
      expect(result).toHaveProperty("Other");

      Object.values(result).forEach((data: any) => {
        expect(data).toHaveProperty("total");
        expect(data).toHaveProperty("accepted");
        expect(data).toHaveProperty("rate");
        expect(typeof data.rate).toBe("number");
      });
    });

    it("should calculate correct acceptance rate", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.analytics.acceptanceRates();

      const hackathonRate = result.Hackathon;
      if (hackathonRate.total > 0) {
        const expectedRate = Math.round((hackathonRate.accepted / hackathonRate.total) * 100);
        expect(hackathonRate.rate).toBe(expectedRate);
      }
    });
  });

  describe("seasonalTrends", () => {
    it("should return seasonal trends data", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.analytics.seasonalTrends();

      expect(Array.isArray(result)).toBe(true);
      result.forEach((item: any) => {
        expect(item).toHaveProperty("month");
        expect(item).toHaveProperty("applications");
        expect(item).toHaveProperty("accepted");
        expect(typeof item.applications).toBe("number");
        expect(typeof item.accepted).toBe("number");
      });
    });

    it("should return sorted data by date", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.analytics.seasonalTrends();

      if (result.length > 1) {
        for (let i = 0; i < result.length - 1; i++) {
          const currentDate = new Date(result[i].month);
          const nextDate = new Date(result[i + 1].month);
          expect(currentDate.getTime()).toBeLessThanOrEqual(nextDate.getTime());
        }
      }
    });
  });

  describe("statusDistribution", () => {
    it("should return status distribution", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.analytics.statusDistribution();

      expect(Array.isArray(result)).toBe(true);
      const statuses = result.map((item: any) => item.status);
      expect(statuses).toContain("Interested");
      expect(statuses).toContain("Applied");
      expect(statuses).toContain("Under Review");
      expect(statuses).toContain("Accepted");
      expect(statuses).toContain("Rejected");
      expect(statuses).toContain("Withdrawn");
    });

    it("should have non-negative counts", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.analytics.statusDistribution();

      result.forEach((item: any) => {
        expect(item.count).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe("summary", () => {
    it("should return summary statistics", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.analytics.summary();

      expect(result).toHaveProperty("totalApplications");
      expect(result).toHaveProperty("accepted");
      expect(result).toHaveProperty("rejected");
      expect(result).toHaveProperty("underReview");
      expect(result).toHaveProperty("overallAcceptanceRate");

      expect(typeof result.totalApplications).toBe("number");
      expect(typeof result.accepted).toBe("number");
      expect(typeof result.rejected).toBe("number");
      expect(typeof result.underReview).toBe("number");
      expect(typeof result.overallAcceptanceRate).toBe("number");
    });

    it("should have valid acceptance rate percentage", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.analytics.summary();

      expect(result.overallAcceptanceRate).toBeGreaterThanOrEqual(0);
      expect(result.overallAcceptanceRate).toBeLessThanOrEqual(100);
    });

    it("should calculate correct overall acceptance rate", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.analytics.summary();

      if (result.totalApplications > 0) {
        const expectedRate = Math.round((result.accepted / result.totalApplications) * 100);
        expect(result.overallAcceptanceRate).toBe(expectedRate);
      }
    });
  });
});
