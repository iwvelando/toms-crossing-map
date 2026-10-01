import { chromium } from "@playwright/test";
import { preview } from "vite";

const server = await preview({ preview: { host: "127.0.0.1", port: 4174, strictPort: true } });
let browser;
try {
  browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl"],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce", colorScheme: "dark" });
  await page.goto("http://127.0.0.1:4174/");
  await page.locator('#map[data-asset="loaded"]').waitFor();
  await page.evaluate(() => {
    for (const el of document.querySelectorAll(".map-heading,.map-toolbar,.map-key,.map-disclaimer,.map-instructions"))
      el.style.display = "none";
  });
  // Closed reading boundary: the art contains no story labels or journey spoilers.
  const art = await page.locator("#map canvas").screenshot();
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.evaluate((png) => {
    document.body.replaceChildren();
    document.body.style.cssText = "margin:0;background:#0b1522;color:#f2eddf;min-height:0";
    const card = document.createElement("div");
    card.style.cssText = "width:1200px;height:630px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:#0b1522";
    const title = document.createElement("h1");
    title.textContent = "Tom’s Crossing";
    title.style.cssText = "font:56px Georgia,serif;margin:0;color:#f2eddf";
    const subtitle = document.createElement("p");
    subtitle.textContent = "AN UNOFFICIAL FAN ATLAS";
    subtitle.style.cssText = "font:14px sans-serif;letter-spacing:4px;margin:10px 0 0;color:#c6ad79";
    const image = document.createElement("img");
    image.src = `data:image/png;base64,${png}`;
    image.style.cssText = "width:760px;height:430px;object-fit:contain";
    card.append(title, subtitle, image);
    document.body.append(card);
    return image.decode();
  }, art.toString("base64"));
  await page.screenshot({ path: "public/og-image.png" });
  await page.setViewportSize({ width: 180, height: 180 });
  await page.evaluate(() => {
    document.body.replaceChildren();
    const icon = document.createElement("img");
    icon.src = "/favicon.svg";
    icon.style.cssText = "display:block;width:180px;height:180px;box-sizing:border-box;padding:20px;background:#0b1522";
    document.body.append(icon);
    return icon.decode();
  });
  await page.screenshot({ path: "public/apple-touch-icon.png" });
} finally {
  await browser?.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}
console.log("Wrote public/og-image.png and public/apple-touch-icon.png.");
