import fs from "node:fs";
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const venues = JSON.parse(fs.readFileSync("public/data/venues.json", "utf8"));
const catalog = JSON.parse(fs.readFileSync("public/data/collections.json", "utf8"));
const hallIds = catalog.groups.find((g) => g.id === "community-halls").venue_ids;
const cards = (p) => p.locator("#results .card");
const card = (p, id) => p.locator(`#results [data-venue="${id}"]`);
const fixture = (id, name, extra = {}) => ({ id, city: "Dhaka", name, aliases: [], bn_name: null, category: "Convention Center", division: "6", district: "47", area: "Banasree", address: "TEST ONLY address, Dhaka", address_status: "published", coordinates: { lat: 23.76, lon: 90.42 }, phones: [{ number: "+8801712345678", source: "https://example.org/test-only", checked: "2026-10-25", status: "published-not-call-tested" }], website: null, capacity: null, capacity_layout: null, facilities: [], verification: "source-checked", last_checked: "2026-10-25", evidence: [{ url: "https://example.org/test-only", fields: ["name", "phones"], kind: "official", checked: "2026-10-25" }], notes: "Synthetic browser fixture only.", ...extra });
const sample = [fixture("bd-test-alpha", "TEST ONLY Alpha", { capacity: 1200, capacity_layout: "Theatre seating", facilities: ["Parking", "Air conditioning", "Catering"] }), fixture("bd-test-beta", "TEST ONLY Beta", { area: "Khilgaon", coordinates: { lat: 23.73, lon: 90.44 } }), fixture("bd-test-closed", "TEST ONLY Aardvark", { review_notice: "Closure reported. Confirm current operation.", coordinates: null, phones: [] }), fixture("bd-test-hotel", "TEST ONLY Hotel", { area: "Banani", coordinates: { lat: 23.79, lon: 90.4 } })];
async function mock(page, rows = sample) {
  await page.route("**/data/venues.json", (r) => r.fulfill({ json: rows }));
  await page.route("**/data/collections.json", (r) => r.fulfill({ json: { default: "community-halls", groups: [{ id: "community-halls", venue_ids: rows.filter((v) => v.id !== "bd-test-hotel").map((v) => v.id) }, { id: "hotels", venue_ids: rows.filter((v) => v.id === "bd-test-hotel").map((v) => v.id) }] } }));
}
async function more(page) {
  if (!await page.locator("#filterDock .more-filters").evaluate((n) => n.open)) await page.locator("#filterDock summary").click();
}
async function area(page, name) {
  const input = page.locator("#areaQuery");
  await input.fill(name);
  await page.locator('#areaOptions [role="option"]').filter({ has: page.locator("span", { hasText: new RegExp("^" + name + "$") }) }).click();
}
async function healthy(page) {
  await page.goto("/");
  await expect(cards(page)).toHaveCount(hallIds.length);
}
test("slow loading never presents transient zero counts; failed data has a working retry", async ({ page }) => {
  let release;
  const gate = new Promise((r) => release = r);
  await page.route("**/data/venues.json", async (r) => {
    await gate;
    await r.continue();
  });
  await page.goto("/");
  await expect(page.locator("#directory")).toHaveAttribute("aria-busy", "true");
  await expect(page.locator("#resultHeading")).toHaveText("Loading venues\u2026");
  await expect(page.locator("#stats")).not.toContainText("0 venues");
  release();
  await expect(cards(page)).toHaveCount(hallIds.length);
  await page.unroute("**/data/venues.json");
  let failed = true;
  await page.route("**/data/venues.json", (r) => failed ? r.fulfill({ status: 503, body: "Unavailable" }) : r.continue());
  await page.reload();
  await expect(page.locator("#resultHeading")).toHaveText("Directory unavailable");
  failed = false;
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(cards(page)).toHaveCount(hallIds.length);
});
test("real Dhaka data: hall-first, English UI, aliases, details, source and correction links", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await healthy(page);
  expect(await page.locator("body").innerText()).not.toMatch(/[\u0980-\u09ff]/);
  await page.locator("#search").fill("Abakas");
  await expect(cards(page)).toHaveCount(1);
  await expect(cards(page)).toContainText("Abacus");
  await expect(cards(page).locator('a[href="tel:+880248321499"]')).toBeVisible();
  await cards(page).getByRole("button", { name: "View details", exact: true }).click();
  await expect(page.locator("#dialog")).toHaveAttribute("aria-labelledby", "dialogTitle");
  await expect(page.locator('#dialog a[href^="tel:"]').first()).toBeVisible();
  await expect(page.locator(".source-details")).not.toHaveAttribute("open", "");
  await page.locator(".source-details summary").click();
  const correction = page.getByRole("link", { name: "Report incorrect information" });
  const url = new URL(await correction.getAttribute("href"));
  expect(url.host).toBe("github.com");
  expect(url.searchParams.get("body")).toContain("bd-abacus-convention-center");
  await page.keyboard.press("Escape");
  await expect(cards(page).getByRole("button", { name: "View details", exact: true })).toBeFocused();
  expect(errors).toEqual([]);
});
test("area exact and nearby counts are separate, with targeted zero-coverage recovery", async ({ page }) => {
  await healthy(page);
  await page.locator('#priorityAreas [data-area-choice="Rampura"]').click();
  await expect(page.locator("#areaContext")).toContainText("No venues indexed in Rampura yet");
  await expect(page.locator("#areaContext")).toContainText("nearby");
  expect(await cards(page).count()).toBeGreaterThan(0);
  for (const text of await cards(page).locator(".card-location").allTextContents()) expect(text).toContain("Nearby");
  await page.locator("#includeNearby").uncheck();
  await expect(cards(page)).toHaveCount(0);
  await expect(page.locator("#areaContext")).toContainText("coverage is incomplete");
  await page.locator("#results").getByRole("button", { name: "Show nearby venues", exact: true }).click();
  expect(await cards(page).count()).toBeGreaterThan(0);
  await expect(page.locator("#area")).toHaveValue("Rampura");
});
test("curated Bangla/roman aliases agree and short AK does not match Dhaka", async ({ page }) => {
  await healthy(page);
  let ids;
  for (const q of ["Banasree", "Banasri", "\u09AC\u09A8\u09B6\u09CD\u09B0\u09C0"]) {
    await page.locator("#search").fill(q);
    await expect.poll(() => cards(page).count()).toBeGreaterThan(0);
    await expect(page.locator("#activeFilters")).toContainText(q);
    const found = await cards(page).evaluateAll((ns) => ns.map((n) => n.dataset.venue));
    if (ids) expect(found).toEqual(ids);
    ids = found;
  }
  await page.locator("#search").fill("AK");
  await expect(cards(page)).toHaveCount(1);
  await expect(cards(page)).toContainText("AK Convention");
  await page.locator("#search").fill("definitely-no-indexed-match");
  await expect(cards(page)).toHaveCount(0);
  await expect(page.locator("#results")).toContainText("No venues match");
});
test("Saved ignores Explore filters, preserves each tab and supports undo and reload", async ({ page }) => {
  await mock(page);
  await page.goto("/");
  await expect(cards(page)).toHaveCount(3);
  await card(page, "bd-test-alpha").locator(".save").click();
  await page.locator("#search").fill("Beta");
  await page.locator("#saved").click();
  await expect(cards(page)).toHaveCount(1);
  await expect(cards(page)).toContainText("Alpha");
  await cards(page).locator(".save").click();
  await expect(cards(page)).toHaveCount(0);
  await page.locator("#undoSave").click();
  await expect(cards(page)).toHaveCount(1);
  await page.reload();
  await expect(cards(page)).toHaveCount(1);
  await page.locator("#explore").click();
  await page.locator("#search").fill("Beta");
  await expect(cards(page)).toHaveCount(1);
  await page.locator("#saved").click();
  await page.locator("#explore").click();
  await expect(page.locator("#search")).toHaveValue("Beta");
  await expect(cards(page)).toContainText("Beta");
});
test("hotel can be saved independently and its shared detail can appear on the directory map", async ({ page, context }) => {
  await mock(page);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/?collection=hotels");
  await expect(cards(page)).toHaveCount(1);
  await cards(page).locator(".save").click();
  await page.locator("#saved").click();
  await expect(cards(page)).toContainText("Hotel");
  await cards(page).getByRole("button", { name: "View details", exact: true }).click();
  await page.getByRole("button", { name: "Copy venue link", exact: true }).click();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(new URL(link).searchParams.get("venue")).toBe("bd-test-hotel");
  await page.goto(link);
  await expect(page.locator("#dialog")).toBeVisible();
  await page.getByRole("button", { name: "Show on directory map", exact: true }).click();
  await expect(page.locator("#mapSelection")).toContainText("Hotel");
});
test("capacity coverage explains unknowns; facilities and status filters use actual facts", async ({ page }) => {
  await mock(page);
  await page.goto("/");
  await more(page);
  await page.locator("#size").selectOption("Large");
  await expect(cards(page)).toHaveCount(1);
  await expect(page.locator("#capacityContext")).toContainText("1 of 3");
  await page.locator("#capacityContext").getByRole("button", { name: "Show venues with unknown capacity" }).click();
  await expect(cards(page)).toHaveCount(2);
  await page.locator("#reset").click();
  await page.locator("#reviewStatus").selectOption("needs-review");
  await expect(cards(page)).toHaveCount(1);
  await expect(cards(page)).toContainText("Closure reported");
  await page.locator("#reviewStatus").selectOption("no-notice");
  await expect(cards(page)).toHaveCount(2);
  await page.locator("#reset").click();
  await more(page);
  await page.locator("#parking").check();
  await page.locator("#airConditioning").check();
  await page.locator("#catering").check();
  await expect(cards(page)).toHaveCount(1);
  await expect(cards(page)).toContainText("Alpha");
});
test("flagged listings rank last and URL state restores after Back and reload", async ({ page }) => {
  await mock(page);
  await page.goto("/");
  await expect(cards(page).last()).toContainText("Aardvark");
  await area(page, "Khilgaon");
  await page.locator("#includeNearby").uncheck();
  await expect(cards(page)).toHaveCount(1);
  expect(new URL(page.url()).searchParams.get("area")).toBe("Khilgaon");
  await page.locator("#phone").check();
  await page.goBack();
  await expect(page.locator("#phone")).not.toBeChecked();
  await expect(page.locator("#area")).toHaveValue("Khilgaon");
  await page.reload();
  await expect(cards(page)).toHaveCount(1);
  await cards(page).getByRole("button", { name: "View details", exact: true }).click();
  expect(new URL(page.url()).searchParams.get("venue")).toBe("bd-test-beta");
  await page.goBack();
  await expect(page.locator("#dialog")).not.toBeVisible();
});
test("comparison aligns facts, calls all numbers, removes columns and enforces max three", async ({ page }) => {
  await mock(page);
  await page.goto("/?collection=");
  for (const id of ["bd-test-alpha", "bd-test-beta", "bd-test-closed"]) await card(page, id).locator(".compare-toggle").click();
  await expect(page.locator("#compareNames .compare-name")).toHaveCount(3);
  await card(page, "bd-test-hotel").locator(".compare-toggle").click();
  await expect(page.locator("#feedbackText")).toContainText("up to three");
  await page.locator("#openCompare").click();
  const row = (label) => page.getByRole("row").filter({ has: page.getByRole("rowheader", { name: label, exact: true }) });
  await expect(row("Area").getByRole("cell")).toHaveText(["Banasree", "Khilgaon", "Banasree"]);
  await expect(row("Phone").locator('a[href^="tel:"]')).toHaveCount(2);
  await expect(row("Needs confirmation").getByRole("cell").first()).toHaveText("No review notice recorded");
  await page.locator("#dialog").getByRole("button", { name: "Remove TEST ONLY Aardvark from comparison", exact: true }).click();
  await expect(row("Area").getByRole("cell")).toHaveCount(2);
  await page.keyboard.press("Escape");
  await page.reload();
  await expect(page.locator("#compareNames .compare-name")).toHaveCount(2);
});
test("map lazy loading, marker selection, tile failure fallback and unknown-point records", async ({ page }) => {
  await mock(page);
  const requests = [];
  page.on("request", (r) => requests.push(r.url()));
  await page.route("https://tile.openstreetmap.org/**", (r) => r.abort());
  await page.goto("/");
  await expect(cards(page)).toHaveCount(3);
  expect(requests.some((u) => u.includes("/src/map.js"))).toBe(false);
  await page.locator("#mapView").click();
  await expect(page.locator(".venue-marker")).toHaveCount(2);
  await page.locator(".venue-marker").first().click();
  await expect(page.locator(".card.selected")).toHaveCount(1);
  await expect(page.locator("#mapSelection")).toContainText("TEST ONLY");
  await expect(page.locator("#markerContext")).toContainText("1 without a marker");
  await expect(page.locator("#mapMessage")).toContainText("Map tiles could not load");
  await page.locator("#mapListFallback").click();
  await expect(cards(page)).toHaveCount(3);
});
test("map clusters nearby pins accessibly", async ({ page }) => {
  await mock(page, sample.slice(0, 2).map((v) => ({ ...v, coordinates: { lat: 23.76, lon: 90.42 } })));
  await page.goto("/");
  await page.locator("#mapView").click();
  await expect(page.locator(".marker-cluster")).toHaveCount(1);
  await expect(page.locator(".marker-cluster")).toHaveAttribute("aria-label", /2 venues/);
  await expect(page.locator(".marker-cluster")).toHaveAttribute("tabindex", "0");
});
test("one-time nearby distance is sorted and never serialized or stored", async ({ page, context }) => {
  await mock(page);
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: 23.760123, longitude: 90.420456 });
  await page.addInitScript(() => {
    const original = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
    window.geoCalls = 0;
    navigator.geolocation.getCurrentPosition = (...a) => {
      window.geoCalls++;
      return original(...a);
    };
  });
  await page.goto("/");
  expect(await page.evaluate(() => window.geoCalls)).toBe(0);
  await page.locator("#filterDock .nearby").click();
  await expect(page.locator("#message")).toContainText("straight-line");
  await expect(cards(page).first()).toContainText("Alpha");
  expect(await page.evaluate(() => window.geoCalls)).toBe(1);
  expect(page.url()).not.toContain("23.760123");
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain("23.760123");
  await expect(cards(page).first()).toContainText("km \xB7 straight-line");
});
test("denied geolocation and unavailable storage retain usable exploration", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", { get() {
      throw new DOMException("Unavailable", "SecurityError");
    } });
    navigator.geolocation.getCurrentPosition = (_ok, fail) => fail({ code: 1 });
  });
  await mock(page);
  await page.goto("/");
  await expect(page.locator("#storageWarning")).toBeVisible();
  await page.locator("#filterDock .nearby").click();
  await expect(page.locator("#message")).toContainText("permission was denied");
  await card(page, "bd-test-alpha").locator(".save").click();
  await page.locator("#saved").click();
  await expect(cards(page)).toHaveCount(1);
});
test("mobile filters have draft, cancel, clear and apply; combobox is keyboard usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mock(page);
  await page.goto("/");
  await page.locator("#mobileFilters").click();
  await page.locator("#draft-phone").check();
  await page.locator("#cancelFilters").click();
  expect(new URL(page.url()).searchParams.has("phone")).toBe(false);
  await expect(cards(page)).toHaveCount(3);
  await page.locator("#mobileFilters").click();
  await expect(page.locator("#draft-phone")).not.toBeChecked();
  await page.locator("#draft-areaQuery").fill("Khilgaon");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await page.locator("#draft-includeNearby").uncheck();
  await page.locator("#applyFilters").click();
  await expect(cards(page)).toHaveCount(1);
  await expect(page.locator("#mobileFilters")).toBeFocused();
  await page.locator("#mobileFilters").click();
  await page.locator("#clearDraft").click();
  await page.keyboard.press("Escape");
  await expect(cards(page)).toHaveCount(1);
});
for (const width of [360, 390, 768, 1363, 1920]) test(`responsive layout and detail ${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height: 936 });
  await healthy(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (width === 1363) {
    const b = await cards(page).first().boundingBox();
    expect(b.y + b.height).toBeLessThan(936);
  }
  await page.screenshot({ path: `test-results/layout-${width}.png` });
  await cards(page).first().getByRole("button", { name: "View details", exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `test-results/detail-${width}.png` });
  await page.keyboard.press("Escape");
});
test("accessible explore, details, comparison and mobile filter dialogs", async ({ page }) => {
  await mock(page);
  await page.goto("/");
  const scan = async () => expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await scan();
  for (const id of ["bd-test-alpha", "bd-test-beta"]) await card(page, id).locator(".compare-toggle").click();
  await page.locator("#openCompare").click();
  await scan();
  await page.keyboard.press("Escape");
  await card(page, "bd-test-alpha").getByRole("button", { name: "View details", exact: true }).click();
  await scan();
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 360, height: 800 });
  await page.locator("#mobileFilters").click();
  await scan();
});
test("saving and comparing preserve the current map viewport", async ({ page }) => {
  await mock(page);
  await page.goto("/");
  await page.locator("#mapView").click();
  await expect(page.locator(".venue-marker")).toHaveCount(2);
  const map = page.locator("#map");
  await map.click({ position: { x: 180, y: 170 } });
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(300);
  const pane = page.locator(".leaflet-map-pane");
  const transform = await pane.evaluate((n) => n.style.transform);
  await card(page, "bd-test-alpha").locator(".save").click();
  await card(page, "bd-test-alpha").locator(".compare-toggle").click();
  expect(await pane.evaluate((n) => n.style.transform)).toBe(transform);
});
test("200 percent desktop reflow equivalent keeps controls and dialogs usable", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 683, height: 468 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  await mock(page);
  await page.goto("/");
  await expect(cards(page)).toHaveCount(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator("#mobileFilters").click();
  await expect(page.locator("#applyFilters")).toBeVisible();
  await page.keyboard.press("Escape");
  await cards(page).first().getByRole("button", { name: "View details", exact: true }).click();
  await expect(page.locator('#dialog a[href^="tel:"]').first()).toBeVisible();
  await page.screenshot({ path: "test-results/reflow-200-equivalent.png" });
  await context.close();
});
test("visible button wording is included in accessible names for voice control", async ({ page }) => {
  await healthy(page);
  const result = await new AxeBuilder({ page }).withRules(["label-content-name-mismatch"]).analyze();
  expect(result.violations).toEqual([]);
  await cards(page).first().locator(".compare-toggle").click();
  await cards(page).first().locator(".save").click();
  expect((await new AxeBuilder({ page }).withRules(["label-content-name-mismatch"]).analyze()).violations).toEqual([]);
});
