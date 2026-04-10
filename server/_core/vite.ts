import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // Get the directory of this file (dist/_core/vite.js after bundling)
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  // Navigate from dist/_core/ to dist/public/
  const distPath = path.join(__dirname, "..", "public");
  
  console.log("[Server] Script location:", __filename);
  console.log("[Server] Static files path:", distPath);
  console.log("[Server] Path exists:", fs.existsSync(distPath));
  
  // Fallback to process.cwd() if relative path doesn't work
  let publicDir = distPath;
  if (!fs.existsSync(distPath)) {
    const altPath = path.join(process.cwd(), "dist", "public");
    console.log("[Server] Main path not found, trying:", altPath);
    if (fs.existsSync(altPath)) {
      publicDir = altPath;
      console.log("[Server] Using alternative path");
    } else {
      console.error(`[Server] ERROR: Build directory not found`);
      console.log("[Server] Tried paths:");
      console.log("  1.", distPath);
      console.log("  2.", altPath);
      console.log("[Server] CWD:", process.cwd());
      if (fs.existsSync(path.join(process.cwd(), "dist"))) {
        console.log("[Server] Contents of dist/:", fs.readdirSync(path.join(process.cwd(), "dist")));
      }
    }
  }

  // Serve static files
  app.use(express.static(publicDir, { maxAge: "1d" }));

  // API routes should not fall through to index.html
  app.get("/api/*", (_req, res) => {
    res.status(404).json({ error: "API endpoint not found" });
  });

  // Fall through to index.html for SPA routing
  app.use("*", (_req, res) => {
    const indexPath = path.join(publicDir, "index.html");
    if (!fs.existsSync(indexPath)) {
      console.error("[Server] index.html not found at:", indexPath);
      res.status(500).json({ error: "Application not properly built - index.html missing" });
      return;
    }
    res.sendFile(indexPath);
  });
}
