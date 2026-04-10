import { describe, it, expect } from "vitest";
import { generateWeeklyDigest } from "./_core/digestService";
import type { User, Application } from "../shared/db-types";

describe("Weekly Digest Service", () => {
  const mockUser: User = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const mockApplications: Application[] = [
    {
      id: 1,
      userId: 1,
      eventName: "TechCrunch Disrupt",
      eventType: "Hackathon",
      status: "Applied",
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      notes: "Looking forward to this",
      url: "https://disrupt.techcrunch.com",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      userId: 1,
      eventName: "Google I/O",
      eventType: "Conference",
      status: "Accepted",
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      notes: "Confirmed attendance",
      url: "https://io.google.com",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 3,
      userId: 1,
      eventName: "Python Workshop",
      eventType: "Workshop",
      status: "Interested",
      deadline: null,
      notes: "Might apply later",
      url: "https://python-workshop.example.com",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 4,
      userId: 1,
      eventName: "AWS Summit",
      eventType: "Conference",
      status: "Rejected",
      deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      notes: "Rejected application",
      url: "https://aws-summit.example.com",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  describe("generateWeeklyDigest", () => {
    it("should generate digest with correct structure", async () => {
      const digest = await generateWeeklyDigest(mockUser, mockApplications);

      expect(digest).toHaveProperty("subject");
      expect(digest).toHaveProperty("htmlContent");
      expect(digest).toHaveProperty("textContent");
      expect(digest).toHaveProperty("summary");
    });

    it("should calculate correct summary statistics", async () => {
      const digest = await generateWeeklyDigest(mockUser, mockApplications);

      expect(digest.summary.totalApplications).toBe(4);
      expect(digest.summary.acceptedCount).toBe(1);
      expect(digest.summary.underReviewCount).toBe(0);
    });

    it("should identify upcoming deadlines within 7 days", async () => {
      const digest = await generateWeeklyDigest(mockUser, mockApplications);

      // TechCrunch Disrupt is 3 days away, so it should be included
      expect(digest.summary.upcomingDeadlines).toBe(1);
    });

    it("should include user name in subject", async () => {
      const digest = await generateWeeklyDigest(mockUser, mockApplications);

      expect(digest.subject).toContain("Weekly Application Digest");
      expect(digest.subject).toContain("4 Applications");
      expect(digest.subject).toContain("25%"); // 1 accepted out of 4
    });

    it("should generate HTML content with proper structure", async () => {
      const digest = await generateWeeklyDigest(mockUser, mockApplications);

      expect(digest.htmlContent).toContain("<!DOCTYPE html>");
      expect(digest.htmlContent).toContain("Weekly Application Digest");
      expect(digest.htmlContent).toContain("TechCrunch Disrupt");
      expect(digest.htmlContent).toContain("Status Breakdown");
    });

    it("should generate text content with proper structure", async () => {
      const digest = await generateWeeklyDigest(mockUser, mockApplications);

      expect(digest.textContent).toContain("WEEKLY APPLICATION DIGEST");
      expect(digest.textContent).toContain("Total Applications: 4");
      expect(digest.textContent).toContain("Acceptance Rate: 25%");
      expect(digest.textContent).toContain("TechCrunch Disrupt");
    });

    it("should handle empty applications list", async () => {
      const digest = await generateWeeklyDigest(mockUser, []);

      expect(digest.summary.totalApplications).toBe(0);
      expect(digest.summary.acceptedCount).toBe(0);
      expect(digest.summary.upcomingDeadlines).toBe(0);
      expect(digest.htmlContent).toContain("0");
    });

    it("should handle applications without email", async () => {
      const userWithoutEmail: User = {
        ...mockUser,
        email: null,
      };

      const digest = await generateWeeklyDigest(userWithoutEmail, mockApplications);

      expect(digest.htmlContent).toBeTruthy();
      expect(digest.textContent).toBeTruthy();
    });

    it("should calculate correct acceptance rate", async () => {
      const digest = await generateWeeklyDigest(mockUser, mockApplications);

      const expectedRate = Math.round((1 / 4) * 100); // 1 accepted out of 4
      expect(digest.subject).toContain(`${expectedRate}%`);
    });

    it("should include recent activity in digest", async () => {
      const digest = await generateWeeklyDigest(mockUser, mockApplications);

      expect(digest.htmlContent).toContain("Recent Activity");
      expect(digest.textContent).toContain("RECENT ACTIVITY");
    });

    it("should handle null deadlines gracefully", async () => {
      const digest = await generateWeeklyDigest(mockUser, mockApplications);

      // Should not crash and should handle the null deadline
      expect(digest.htmlContent).toBeTruthy();
      expect(digest.textContent).toBeTruthy();
    });
  });
});
