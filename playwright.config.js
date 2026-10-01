import { defineConfig, devices } from "@playwright/test";
const chromiumLaunch = { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE, args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl"] };
const port = Number(process.env.PLAYWRIGHT_PORT || 4173);
const baseURL = process.env.BASE_URL || `http://127.0.0.1:${port}`;
export default defineConfig({
  testDir: "./tests/browser",
  // Each case owns a fresh page; let shards distribute bounded matrix cases.
  fullyParallel: true,
  use: { baseURL, viewport: { width: 1440, height: 1000 }, trace: "retain-on-failure" },
  projects: [
    { name: "chromium", testIgnore: /participant-layout\.spec\.js/, use: { browserName: "chromium", launchOptions: chromiumLaunch } },
    { name: "phone", testMatch: /layout\.spec\.js/, use: { ...devices["Pixel 7"], launchOptions: chromiumLaunch, viewport: { width: 360, height: 760 } } },
    ...(process.env.WEBKIT ? [{ name: "webkit", testMatch: /layout\.spec\.js/, use: { ...devices["iPhone 15"] } }] : []),
  ],
  webServer: process.env.BASE_URL ? undefined : {
    command: `npm run build && npm run preview -- --port ${port} --strictPort`,
    url: baseURL, reuseExistingServer: false,
  },
});
