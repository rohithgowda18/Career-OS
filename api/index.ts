import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// In Vercel, the public directory is at the root level (same level as api/)
const publicDir = path.join(__dirname, "..", "public");

console.log("[API] Script location:", __filename);
console.log("[API] Dirname:", __dirname);
console.log("[API] Public directory:", publicDir);
console.log("[API] Public directory exists:", fs.existsSync(publicDir));

if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir, { maxAge: "1d" }));
  console.log("[API] ✓ Serving static files from:", publicDir);
  console.log("[API] Files in public:", fs.readdirSync(publicDir));
} else {
  console.error("[API] ✗ Public directory not found at:", publicDir);
  console.log("[API] Parent dir exists:", fs.existsSync(path.join(__dirname, "..")));
  console.log("[API] Parent dir contents:", fs.readdirSync(path.join(__dirname, "..")));
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    publicDir,
    publicDirExists: fs.existsSync(publicDir)
  });
});

// SPA fallback - serve index.html for all non-API routes
app.use("*", (req, res, next) => {
  // Don't serve index.html for actual API routes
  if (req.path.startsWith("/api/")) {
    return next();
  }

  const indexPath = path.join(publicDir, "index.html");

  if (!fs.existsSync(indexPath)) {
    console.error("[API] index.html not found at:", indexPath);
    return res.status(500).json({
      error: "Application not properly deployed - index.html missing",
      details: { publicDir, indexPath }
    });
  }

  res.sendFile(indexPath);
});

// 404 handler for API routes
app.use((req, res) => {
  res.status(404).json({ error: "Not found", path: req.path });
});

// Export for Vercel
