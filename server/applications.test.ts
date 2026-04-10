import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("applications router", () => {
  describe("authentication", () => {
    it("list requires authentication", async () => {
      const caller = appRouter.createCaller({ user: null, req: {} as any, res: {} as any });
      
      try {
        await caller.applications.list();
        expect.fail("Should throw unauthorized error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });

    it("create requires authentication", async () => {
      const caller = appRouter.createCaller({ user: null, req: {} as any, res: {} as any });
      
      try {
        await caller.applications.create({
          eventName: "Test Event",
          eventType: "Hackathon",
          status: "Interested",
        });
        expect.fail("Should throw unauthorized error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });

    it("update requires authentication", async () => {
      const caller = appRouter.createCaller({ user: null, req: {} as any, res: {} as any });
      
      try {
        await caller.applications.update({
          id: 999999,
          status: "Accepted",
        });
        expect.fail("Should throw unauthorized error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });

    it("delete requires authentication", async () => {
      const caller = appRouter.createCaller({ user: null, req: {} as any, res: {} as any });
      
      try {
        await caller.applications.delete({ id: 999999 });
        expect.fail("Should throw unauthorized error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });

    it("get requires authentication", async () => {
      const caller = appRouter.createCaller({ user: null, req: {} as any, res: {} as any });
      
      try {
        await caller.applications.get({ id: 999999 });
        expect.fail("Should throw unauthorized error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("validation", () => {
    it("validates event name is required", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      try {
        await caller.applications.create({
          eventName: "",
          eventType: "Hackathon",
          status: "Interested",
        });
        expect.fail("Should throw validation error");
      } catch (error: any) {
        expect(error.code).toBe("BAD_REQUEST");
      }
    });

    it("validates event type enum", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      try {
        await caller.applications.create({
          eventName: "Test Event",
          eventType: "Invalid" as any,
          status: "Interested",
        });
        expect.fail("Should throw validation error");
      } catch (error: any) {
        expect(error.code).toBe("BAD_REQUEST");
      }
    });

    it("validates status enum", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      try {
        await caller.applications.create({
          eventName: "Test Event",
          eventType: "Hackathon",
          status: "Invalid" as any,
        });
        expect.fail("Should throw validation error");
      } catch (error: any) {
        expect(error.code).toBe("BAD_REQUEST");
      }
    });
  });

  describe("list", () => {
    it("returns empty list for new user", async () => {
      const ctx = createAuthContext(5000);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.applications.list();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("get", () => {
    it("returns not found for non-existent application", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      try {
        await caller.applications.get({ id: 999999 });
        expect.fail("Should throw not found error");
      } catch (error: any) {
        expect(error.code).toBe("NOT_FOUND");
      }
    });
  });
});

describe("preferences router", () => {
  describe("authentication", () => {
    it("get requires authentication", async () => {
      const caller = appRouter.createCaller({ user: null, req: {} as any, res: {} as any });
      
      try {
        await caller.preferences.get();
        expect.fail("Should throw unauthorized error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });

    it("update requires authentication", async () => {
      const caller = appRouter.createCaller({ user: null, req: {} as any, res: {} as any });
      
      try {
        await caller.preferences.update({
          defaultView: "dashboard",
        });
        expect.fail("Should throw unauthorized error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("validation", () => {
    it("validates defaultView enum", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      try {
        await caller.preferences.update({
          defaultView: "invalid" as any,
        });
        expect.fail("Should throw validation error");
      } catch (error: any) {
        expect(error.code).toBe("BAD_REQUEST");
      }
    });
  });

  describe("get", () => {
    it("returns undefined for new user", async () => {
      const ctx = createAuthContext(6000);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.preferences.get();
      expect(result).toBeUndefined();
    });
  });
});
