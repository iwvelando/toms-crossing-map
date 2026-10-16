import { test, expect } from "./fixtures.js";
const url = "https://toms-crossing-map.isaacvelando.com";
test("link previews and home-screen icon @smoke", async ({ page }) => {
  await page.goto("/");
  const title = await page.title();
  const description = await page.locator('meta[name="description"]').getAttribute("content");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${url}/`);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", `${url}/`);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", title);
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", description);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", `${url}/og-image.png`);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
  for (const [path, width, height] of [["/og-image.png", 1200, 630], ["/apple-touch-icon.png", 180, 180]]) {
    const response = await page.request.get(path);
    expect(response.ok()).toBe(true);
    expect(response.headers()["content-type"]).toContain("image/png");
    const png = await response.body();
    expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
    expect(png.readUInt32BE(16)).toBe(width);
    expect(png.readUInt32BE(20)).toBe(height);
  }
});
test("robots.txt points crawlers at the sitemap @smoke", async ({ page }) => {
  const robots = await page.request.get("/robots.txt");
  expect(robots.ok()).toBe(true);
  expect(robots.headers()["content-type"]).toContain("text/plain");
  const rules = await robots.text();
  expect(rules).toMatch(/^User-agent: \*$/m);
  expect(rules).toMatch(/^Allow: \/$/m);
  expect(rules).toContain(`Sitemap: ${url}/sitemap.xml`);
  const sitemap = await page.request.get("/sitemap.xml");
  expect(sitemap.ok()).toBe(true);
  expect(sitemap.headers()["content-type"]).toMatch(/xml/);
  const xml = await sitemap.text();
  expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
  // Only the canonical page: URL parameters never select chapters or content.
  expect([...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1])).toEqual([`${url}/`]);
});
