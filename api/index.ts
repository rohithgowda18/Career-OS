import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// In Vercel, static files will be served from the public directory
// The api/ folder is relative to the root, so we go up one level
const publicDir = path.join(process.cwd(), "public");

console.log("[API] Process CWD:", process.cwd());
console.log("[API] Looking for public files at:", publicDir);
console.log("[API] Public directory exists:", fs.existsSync(publicDir));

if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir, { maxAge: "1d" }));
  console.log("[API] Serving static files from:", publicDir);
} else {
  console.warn("[API] Public directory not found");
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
app.use("*", (_req, res) => {
  const indexPath = path.join(publicDir, "index.html");
  
  if (!fs.existsSync(indexPath)) {
    console.error("[API] index.html not found at:", indexPath);
    console.error("[API] Public directory contents:", fs.existsSync(publicDir) ? fs.readdirSync(publicDir) : "N/A");
    return res.status(500).json({
      error: "Application not properly deployed - index.html missing",
      details: { publicDir, indexPath, exists: fs.existsSync(indexPath) }
    });
  }

  res.sendFile(indexPath);
});

export default app;

