#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Copy dist/public to public/
const source = path.join(__dirname, "dist", "public");
const destination = path.join(__dirname, "public");

function copyDir(src, dest) {
  // Remove target directory if it exists
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true });
  }

  // Create destination
  fs.mkdirSync(dest, { recursive: true });

  // Copy all files
  const files = fs.readdirSync(src);
  files.forEach((file) => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);

    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

console.log(`[Build] Copying ${source} to ${destination}`);
try {
  copyDir(source, destination);
  console.log("[Build] ✓ Successfully copied public files");
} catch (error) {
  console.error("[Build] ✗ Failed to copy public files:", error);
  process.exit(1);
}
