import type { Express, Request, Response } from "express";
import { ONE_YEAR_MS } from "@shared/const";

export function registerMockAuthRoutes(app: Express) {
  // 1. Mock Auth Portal (the UI user sees when they click "Sign In")
  app.get("/app-auth", (req: Request, res: Response) => {
    const state = req.query.state as string;
    const clientId = req.query.client_id as string;
    
    if (!state) {
      return res.status(400).send("Missing state parameter");
    }

    // In a real portal, user would enter credentials.
    // Here we just redirect back with a mock code.
    const callbackUrl = `/api/oauth/callback?code=mock_auth_code&state=${state}`;
    console.log(`[MockAuth] Redirecting to callback: ${callbackUrl}`);
    res.redirect(callbackUrl);
  });

  // 2. Mock Token Exchange Service
  app.post("/webdev.v1.WebDevAuthPublicService/ExchangeToken", (req: Request, res: Response) => {
    console.log("[MockAuth] Received ExchangeToken request");
    res.json({
      accessToken: "mock_access_token",
      expiresIn: Math.floor(ONE_YEAR_MS / 1000),
    });
  });

  // 3. Mock User Info Service
  app.post("/webdev.v1.WebDevAuthPublicService/GetUserInfo", (req: Request, res: Response) => {
    console.log("[MockAuth] Received GetUserInfo request");
    res.json({
      openId: "mock-user-123",
      name: "Mock User",
      email: "mock@example.com",
      platform: "manus",
    });
  });

  // 4. Mock User Info with JWT Service (used in sdk.authenticateRequest)
  app.post("/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt", (req: Request, res: Response) => {
    console.log("[MockAuth] Received GetUserInfoWithJwt request");
    res.json({
      openId: "mock-user-123",
      name: "Mock User",
      email: "mock@example.com",
      platform: "manus",
    });
  });
}
