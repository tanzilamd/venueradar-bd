import fs from "node:fs";
import assert from "node:assert/strict";
import { chromium } from "playwright";
const expected = JSON.parse(fs.readFileSync("public/data/venues.json", "utf8"));
const catalog = JSON.parse(fs.readFileSync("public/data/collections.json", "utf8"));
const expectedAreas = JSON.parse(fs.readFileSync("public/data/areas.json", "utf8"));
const hallIds = catalog.groups.find((g) => g.id === "community-halls").venue_ids;
const url = process.env.LIVE_SITE_URL || "https://tanzilahmed.tech/venueradar-bd/";
const out = "live-verification";
fs.mkdirSync(out, { recursive: true });
const report = { url, commit: process.env.GITHUB_SHA || "local", checks: [], javascriptErrors: [], failedAssets: [] };
const browser = await chromium.launch({ ...process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}, args: ["--no-sandbox"] });
try {
  const context = await browser.newContext({ viewport: { width: 1363, height: 936 } }), page = await context.newPage();
  page.on("pageerror", (e) => report.javascriptErrors.push(e.message));
  page.on("response", (r) => {
    if (r.url().startsWith(url) && r.status() >= 400) report.failedAssets.push([r.url(), r.status()]);
  });
  const ready = async (target = url) => {
    const response2 = await page.goto(target, { waitUntil: "domcontentloaded", timeout: 6e4 });
    assert.equal(response2.status(), 200);
    await page.locator('#directory[aria-busy="false"]').waitFor({ timeout: 2e4 });
  };
  for (let attempt = 0; attempt < 6; attempt++) {
    const r = await context.request.get(url + "data/venues.json?revision=" + report.commit);
    assert.equal(r.status(), 200);
    const actual = await r.json();
    if (JSON.stringify(actual) === JSON.stringify(expected)) break;
    if (attempt === 5) throw Error("The live dataset differs from the deployed commit.");
    await page.waitForTimeout(5e3);
  }
  report.checks.push("Live JSON exactly matches the deployed commit");
  const areaResponse = await context.request.get(url + "data/areas.json?revision=" + report.commit);
  assert.equal(areaResponse.status(), 200);
  assert.deepEqual(await areaResponse.json(), expectedAreas);
  const grouped = expectedAreas.groups?.Paltan || ["Paltan"];
  for (const area of ["Paltan", "Naya Paltan", "Motijheel"]) {
    await ready(url + "?area=" + encodeURIComponent(area) + "&nearby=0");
    const own = expectedAreas.groups?.[area] || [area];
    const exactIds = expected.filter((v) => hallIds.includes(v.id) && own.includes(v.area)).map((v) => v.id).sort();
    assert.deepEqual((await page.locator("#results .card").evaluateAll((nodes) => nodes.map((n) => n.dataset.venue))).sort(), exactIds);
    await page.locator("#includeNearby").check();
    await page.reload();
    await page.locator('#directory[aria-busy="false"]').waitFor();
    assert.ok(await page.locator("#includeNearby").isChecked());
    if (area === "Motijheel") {
      for (const v of expected.filter((v) => hallIds.includes(v.id) && grouped.includes(v.area))) {
        await page.locator('[data-venue="' + v.id + '"]').waitFor();
      }
    }
  }
  report.checks.push("Live area index, Paltan / Naya Paltan grouping and nearby Motijheel survive reload");
  await ready();
  assert.equal(await page.locator("#results .card").count(), hallIds.length);
  const venue = expected.find((v) => hallIds.includes(v.id) && v.phones.length && !v.review_notice) || expected.find((v) => hallIds.includes(v.id)) || expected[0];
  await page.locator("#search").fill(venue.name);
  const card = page.locator('[data-venue="' + venue.id + '"]');
  await card.waitFor();
  if (venue.phones.length) assert.equal(await card.locator('a[href="tel:' + venue.phones[0].number + '"]').count(), 1);
  await card.getByRole("button", { name: "Details", exact: true }).click();
  await page.locator("#dialog[open]").waitFor();
  assert.ok((await page.locator("#dialog").innerText()).includes("Phone numbers"));
  await page.keyboard.press("Escape");
  await page.locator(".brand").click();
  await page.waitForURL(url);
  assert.equal(new URL(page.url()).hash, "");
  report.checks.push("Search, real phone link, detail view and clean home URL");
  const cards = page.locator("#results .card");
  await cards.first().locator(".save").click();
  await page.locator("#saved").click();
  await page.reload();
  await page.locator('#directory[aria-busy="false"]').waitFor();
  assert.equal(await cards.count(), 1);
  await page.locator(".brand").click();
  await page.waitForURL(url);
  if (await cards.count() > 1) {
    await cards.nth(0).locator(".compare-toggle").click();
    await cards.nth(1).locator(".compare-toggle").click();
    await page.locator("#openCompare").click();
    await page.locator("#dialog table").waitFor();
    assert.equal(await page.locator("#dialog thead th").count(), 3);
    await page.keyboard.press("Escape");
  }
  report.checks.push("Saved persistence and two-venue comparison");
  await page.locator("#mapView").click();
  await page.locator("#map .leaflet-marker-icon").first().waitFor({ timeout: 2e4 });
  await page.waitForTimeout(1500);
  report.mapTilesLoaded = await page.locator("#map .leaflet-tile-loaded").count();
  report.clusters = await page.locator("#map .marker-cluster").count();
  report.checks.push("Lazy Leaflet map renders venue markers/clusters");
  await page.screenshot({ path: out + "/desktop-map.png" });
  await page.locator("#listView").click();
  await page.setViewportSize({ width: 360, height: 800 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.locator("#mobileFilters").click();
  await page.locator("#applyFilters").waitFor({ state: "visible" });
  await page.keyboard.press("Escape");
  await page.screenshot({ path: out + "/mobile.png" });
  report.checks.push("Mobile360px layout and filter dialog");
  const imageURL = await page.locator('meta[property="og:image"]').getAttribute("content");
  const image = await context.request.get(new URL(url).hostname === "127.0.0.1" ? url + "social-preview.png" : imageURL);
  assert.equal(image.status(), 200);
  const png = await image.body();
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
  report.checks.push("Live social preview image1200x630");
  const response = await page.goto(url + "manage.html", { waitUntil: "domcontentloaded" });
  assert.equal(response.status(), 200);
  await page.locator("#adminList button").first().waitFor();
  assert.equal(await page.locator("#adminList button").count(), expected.length);
  await page.locator("#adminSearch").fill(venue.name);
  await page.locator("#adminList button").filter({ has: page.getByText(venue.name, { exact: true }) }).first().click();
  assert.equal(await page.locator("#editPhones").inputValue(), venue.phones.map((p) => p.number).join("\n"));
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: out + "/manager-mobile.png" });
  report.checks.push("Live manager loads and displays the current venue contacts");
  assert.deepEqual(report.javascriptErrors, []);
  assert.deepEqual(report.failedAssets, []);
  report.success = true;
} catch (e) {
  report.success = false;
  report.error = e.stack;
  process.exitCode = 1;
} finally {
  await browser.close();
  fs.writeFileSync(out + "/report.json", JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report, null, 2));
}
