import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
const csp = readFileSync("deploy/content-security-policy.txt", "utf8").trim();
export default defineConfig({
  base: "./",
  server: {
    fs: {
      deny: [
        "**/movements.md",
        "**/metadata.json",
        "**/docs/evidence.md",
        "**/local/**",
        "**/.git/**",
        "**/.env*",
        "**/*.{m4b,mp3,wav}",
        "**/companion/**",
      ],
    },
  },
  // Exercise the same policy served by CloudFront in production.
  preview: { headers: { "Content-Security-Policy": csp } },
});
