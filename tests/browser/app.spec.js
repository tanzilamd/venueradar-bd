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
test("real Dhaka directory is contact-first with a simple detail view",async({page})=>{
 const errors=[];page.on("pageerror",e=>errors.push(e.message));await healthy(page);
 const venue=venues.find(v=>hallIds.includes(v.id)&&v.phones.length&&!v.review_notice);
 await page.locator("#search").fill(venue.name);await expect(card(page,venue.id)).toBeVisible();
 await expect(card(page,venue.id).locator('a[href^="tel:"]')).toBeVisible();
 await card(page,venue.id).getByRole("button",{name:/^Details for /}).click();await expect(page.locator("#dialog")).toContainText(venue.name);
 await expect(page.locator("#dialog")).toContainText("Phone numbers");await expect(page.locator("#dialog")).not.toContainText("Published capacity");await expect(page.locator("#dialog .source-details")).toHaveCount(0);expect(errors).toEqual([]);
});
test("area results are exact until nearby neighborhoods are requested",async({page})=>{
 await mock(page);await page.goto("/");await area(page,"Khilgaon");await expect(cards(page)).toHaveCount(1);await expect(cards(page)).toContainText("Beta");
 await expect(page.locator("#includeNearby")).not.toBeChecked();await page.locator("#includeNearby").check();expect(await cards(page).count()).toBeGreaterThanOrEqual(1);
 await area(page,"Rampura");await page.locator("#includeNearby").uncheck();await expect(cards(page)).toHaveCount(0);await page.locator("#results").getByRole("button",{name:"Show nearby venues",exact:true}).click();expect(await cards(page).count()).toBeGreaterThan(0);
});
test("search aliases and empty results remain usable",async({page})=>{
 await mock(page);await page.goto("/");await page.locator("#search").fill("Alpha");await expect(cards(page)).toHaveCount(1);await expect(cards(page)).toContainText("Alpha");
 await page.locator("#search").fill("definitely-no-match");await expect(cards(page)).toHaveCount(0);await expect(page.locator("#results")).toContainText("No venues match");
});
test("map distinguishes no matches from matching halls without map points", async ({ page }) => {
  await mock(page, [fixture("bd-test-unmapped", "TEST ONLY Unmapped Hall", { coordinates: null })]);
  await page.goto("/");
  await page.locator("#mapView").click();
  await expect(page.locator("#mapMessage")).toContainText("matching venues have no source-published map point");
  await page.locator("#search").fill("not-a-hall");
  await expect(page.locator("#mapMessage")).toContainText("No venues match the current search or filters");
  await page.locator("#search").fill("Unmapped Hall");
  await expect(page.locator("#mapMessage")).toContainText("matching venues have no source-published map point");
  await page.locator("#listView").click();
  await expect(cards(page)).toHaveCount(1);
});
test("reported closure is clear on the existing venue card", async ({ page }) => {
  await mock(page, [fixture("bd-test-closure", "TEST ONLY Closed Hall", { review_notice: "Closure reported: matched listing says permanently closed." })]);
  await page.goto("/");
  await expect(cards(page).first()).toContainText("Reported permanently closed");
});
test("Paltan corridor stays together and nearby Motijheel works both ways", async ({ page }) => {
 const rows = [fixture("bd-test-paltan", "TEST ONLY Paltan hall", { area: "Paltan" }), fixture("bd-test-naya", "TEST ONLY Naya hall", { area: "Naya Paltan" }), fixture("bd-test-motijheel", "TEST ONLY Motijheel hall", { area: "Motijheel" })];
 await mock(page, rows); await page.goto("/");
 await area(page, "Naya Paltan"); await expect(cards(page)).toHaveCount(2);
 await expect(page.locator("#areaContext")).toContainText("share a browsing zone");
 await page.locator("#includeNearby").check(); await expect(cards(page)).toHaveCount(3);
 await page.reload(); await expect(cards(page)).toHaveCount(3); await expect(page.locator("#includeNearby")).toBeChecked();
 await expect(card(page, "bd-test-motijheel")).toContainText("Motijheel");
 await area(page, "Motijheel"); await page.locator("#includeNearby").uncheck(); await expect(cards(page)).toHaveCount(1);
 await page.locator("#includeNearby").check(); await expect(cards(page)).toHaveCount(3);
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
  await cards(page).getByRole("button", { name: /^Details for / }).click();
  await page.getByRole("button", { name: "Copy venue link", exact: true }).click();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(new URL(link).searchParams.get("venue")).toBe("bd-test-hotel");
  await page.goto(link);
  await expect(page.locator("#dialog")).toBeVisible();
  await page.getByRole("button", { name: "Show on directory map", exact: true }).click();
  await expect(page.locator("#mapSelection")).toContainText("Hotel");
});
test("simple filters omit capacity and source controls",async({page})=>{
 await mock(page);await page.goto("/");await expect(page.locator("#size,#capacity,#evidence,#verified,.more-filters")).toHaveCount(0);await expect(page.locator("#results")).not.toContainText("Capacity");
 await page.locator("#phone").check();await expect(cards(page)).toHaveCount(2);await page.locator("#reset").click();await expect(cards(page)).toHaveCount(3);
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
  await cards(page).getByRole("button", { name: /^Details for / }).click();
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
  await expect(row("Area / zone").getByRole("cell")).toHaveText(["Banasree", "Khilgaon", "Banasree"]);
  await expect(row("Phone").locator('a[href^="tel:"]')).toHaveCount(2);
  await expect(row("Published capacity").getByRole("cell")).toHaveText([/1,200 people/, "Not published", "Not published"]);
  await expect(row("Documented facilities").getByRole("cell")).toHaveText([/Parking/, "Not documented", "Not documented"]);
  await expect(row("Please check").getByRole("cell").first()).toHaveText("Confirm booking details directly");
  await page.locator("#dialog").getByRole("button", { name: "Remove TEST ONLY Aardvark from comparison", exact: true }).click();
  await expect(row("Area / zone").getByRole("cell")).toHaveCount(2);
  await page.keyboard.press("Escape");
  await page.reload();
  await expect(page.locator("#compareNames .compare-name")).toHaveCount(2);
});
test("map lazy loading, marker selection, tile failure fallback and unknown-point records", async ({ page }) => {
  await mock(page);
  const requests = [];
  page.on("request", (r) => requests.push(r.url()));
  await page.route("https://tiles.openfreemap.org/**", (r) => r.abort());
  await page.goto("/");
  await expect(cards(page)).toHaveCount(3);
  expect(requests.some((u) => u.includes("/src/map.js"))).toBe(false);
  await page.locator("#mapView").click();
  await expect(page.locator(".venue-marker")).toHaveCount(2);
  await page.locator(".venue-marker").first().click();
  await expect(page.locator(".card.selected")).toHaveCount(1);
  await expect(page.locator("#mapSelection")).toContainText("TEST ONLY");
  await expect(page.locator("#markerContext")).toContainText("1 without a marker");
  await expect(page.locator("#mapMessage")).toContainText("Map imagery could not load");
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
  await page.locator(".marker-cluster").evaluate((node) => node.addEventListener("click", () => { window.clusterKeyboardClicks = (window.clusterKeyboardClicks || 0) + 1; }));
  await page.locator(".marker-cluster").focus();
  await page.keyboard.press("Enter");
  expect(await page.evaluate(() => window.clusterKeyboardClicks)).toBeGreaterThan(0);
  await expect(page.locator(".cluster-venue-list button")).toHaveCount(2);
  await page.locator(".cluster-venue-list button").first().click();
  await expect(page.locator("#mapSelection h3")).toContainText("TEST ONLY");
});
test("devices without WebGL keep the Leaflet map and its list fallback", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
      return kind === "webgl2" ? null : original.call(this, kind, ...args);
    };
  });
  await mock(page);
  await page.goto("/");
  await page.locator("#mapView").click();
  await expect(page.locator("#map.leaflet-container")).toBeVisible();
  await expect(page.locator("#map .venue-marker")).toHaveCount(2);
  await page.locator("#mapListFallback").click();
  await expect(cards(page)).toHaveCount(3);
});
test("mobile map selection actions remain above the Compare tray", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await mock(page);
  await page.goto("/");
  for (const id of ["bd-test-alpha", "bd-test-beta"]) await card(page, id).locator(".compare-toggle").click();
  await page.locator("#mapView").click();
  await page.locator("#map .venue-marker").first().click();
  await expect(page.locator("#mapSelection .card-actions")).toBeVisible();
  await expect.poll(async () => {
    const actions = await page.locator("#mapSelection .card-actions").boundingBox();
    const tray = await page.locator("#compareBar").boundingBox();
    return actions.y + actions.height <= tray.y - 8;
  }).toBe(true);
  const positions = await page.locator("#mapSelection .card-actions > *").evaluateAll((nodes) => nodes.map((node) => { const b = node.getBoundingClientRect(); return { x: b.x, y: b.y, right: b.right, bottom: b.bottom }; }));
  for (let i = 0; i < positions.length; i++) for (let j = i + 1; j < positions.length; j++) {
    const a = positions[i], b = positions[j];
    expect(a.right <= b.x || b.right <= a.x || a.bottom <= b.y || b.bottom <= a.y).toBe(true);
  }
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
for (const width of [320, 360, 390, 430, 768, 1024, 1363, 1440, 1920]) test(`responsive layout and detail ${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height: 936 });
  await healthy(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (width === 1363) {
    const b = await cards(page).first().boundingBox();
    expect(b.y + b.height).toBeLessThan(936);
  }
  await page.screenshot({ path: `test-results/layout-${width}.png` });
  await cards(page).first().locator(width <= 720 ? ".venue-name" : ".row-details").click();
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
  await card(page, "bd-test-alpha").getByRole("button", { name: /^Details for / }).click();
  await scan();
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 360, height: 800 });
  await page.locator("#mobileFilters").click();
  await scan();
  await page.keyboard.press("Escape");
  await page.locator("#mapView").click();
  await page.locator("#map .venue-marker, #map .marker-cluster").first().waitFor();
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
  const marker = page.locator("#map .venue-marker").first();
  const position = await marker.boundingBox();
  await card(page, "bd-test-alpha").locator(".save").click();
  await card(page, "bd-test-alpha").locator(".compare-toggle").click();
  const after = await marker.boundingBox();
  expect(Math.abs(after.x - position.x)).toBeLessThan(2);
  expect(Math.abs(after.y - position.y)).toBeLessThan(2);
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
  await cards(page).first().locator(".venue-name").click();
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

test('logo uses a clean home URL and social cards have a real static image',async({page,request})=>{
 await page.goto('/?area=Khilgaon#old-section');await expect(page.locator('#directory')).toHaveAttribute('aria-busy','false');
 await page.locator('.brand').click();await expect(page).toHaveURL('http://127.0.0.1:4173/');await expect(cards(page)).toHaveCount(hallIds.length);
 const meta=page.locator('meta[property="og:image"]');await expect(meta).toHaveAttribute('content','https://tanzilahmed.tech/venueradar-bd/social-preview.png');
 await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content','summary_large_image');
 const response=await request.get('/social-preview.png');expect(response.status()).toBe(200);expect(response.headers()['content-type']).toContain('image/png');const image=await response.body();expect(image.readUInt32BE(16)).toBe(1200);expect(image.readUInt32BE(20)).toBe(630);
});

test('owner-supplied contacts and missing phones are clear',async({page})=>{
 const owner=fixture('bd-test-owner','TEST ONLY Owner',{phones:[{...sample[0].phones[0],status:'submitted-not-verified'}]});await mock(page,[owner,sample[2]]);await page.goto('/?venue=bd-test-owner');
 await expect(page.locator('#dialog')).toContainText('Owner supplied');await page.goto('/?venue=bd-test-closed');await expect(page.locator('#dialog')).toContainText('Phone unavailable');await expect(page.locator('#dialog a[href^="tel:"]')).toHaveCount(0);
});

test("desktop workspace selection updates the contact panel and lazy location map", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 936 });
  await mock(page);
  await page.goto("/");
  const inspector = page.locator("#venueInspector");
  await expect(inspector).toBeVisible();
  await expect(inspector.locator("h2")).toContainText("Alpha");
  await expect(page.locator("#inspectorMap")).toHaveCount(0);
  await card(page, "bd-test-beta").locator(".venue-name").focus();
  await page.keyboard.press("Enter");
  await expect(inspector.locator("h2")).toContainText("Beta");
  await expect(card(page, "bd-test-beta")).toHaveClass(/selected/);
  await expect(page.locator("#selectionAnnouncement")).toContainText("Beta selected");
  await expect(inspector.locator(".venue-marker")).toHaveCount(0);
  await inspector.getByRole("button", { name: /Show location map/ }).click();
  await expect(inspector.locator(".venue-marker")).toHaveCount(1);
  await expect(inspector.locator('a[href="tel:+8801712345678"]')).toBeVisible();
  await card(page, "bd-test-alpha").locator(".card-address").click();
  await expect(inspector.locator("h2")).toContainText("Alpha");
  await card(page, "bd-test-beta").locator(".venue-name").click();
  await expect(inspector.locator("h2")).toContainText("Beta");
  await inspector.getByRole("button", { name: "Save", exact: true }).click();
  await expect(inspector.getByRole("button", { name: "Saved", exact: true })).toBeFocused();
  await expect(page.locator("#savedCount")).toHaveText("1");
  await inspector.getByRole("button", { name: "Compare", exact: true }).click();
  await expect(page.locator("#navCompareCount")).toHaveText("1");
  await expect(inspector.locator("h2")).toContainText("Beta");
  await page.locator("#search").fill("no-such-workspace-hall");
  await expect(inspector).toBeHidden();
});

test("workspace map fallback stays usable and venue labels are rendered as text", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 936 });
  const name = 'TEST ONLY <img src=x onerror="window.injected=1">';
  await mock(page, [fixture("bd-test-escaped", name)]);
  await page.route("https://tiles.openfreemap.org/**", (r) => r.fulfill({ status: 503, body: "Unavailable" }));
  await page.goto("/");
  await cards(page).first().locator(".venue-name").click();
  const inspector = page.locator("#venueInspector");
  await inspector.getByRole("button", { name: /Show location map/ }).click();
  await expect(inspector).toContainText("Map unavailable");
  await expect(inspector.getByRole("link", { name: "Open in Google Maps" })).toBeVisible();
  await expect(inspector.locator(".venue-marker")).toHaveAttribute("data-label", name);
  await expect(page.locator("#inspectorMap img[src=x]")).toHaveCount(0);
  expect(await page.evaluate(() => window.injected)).toBeUndefined();
  await expect(inspector.locator('a[href^="tel:"]')).toBeVisible();
});

test("mobile hall names open a reachable bottom sheet and restore keyboard focus", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await mock(page);
  await page.goto("/");
  await expect(page.locator("#venueInspector")).toBeHidden();
  const name = card(page, "bd-test-alpha").locator(".venue-name");
  await name.click();
  const sheet = page.locator('#dialog[data-kind="detail"]');
  await expect(sheet).toBeVisible();
  const bounds = await sheet.boundingBox();
  expect(bounds.y).toBeGreaterThan(0);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(801);
  await expect(sheet.locator('a[href^="tel:"]').first()).toBeVisible();
  await expect(sheet.getByRole("link", { name: "Google Maps", exact: true })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(name).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("Near me works directly from the mobile filter sheet without storing coordinates", async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: 23.760123, longitude: 90.420456 });
  await mock(page);
  await page.goto("/");
  await page.locator("#mobileFilters").click();
  await page.locator("#filterDialog .nearby").click();
  await expect(page.locator("#filterDialog")).not.toBeVisible();
  await expect(page.locator("#sort")).toHaveValue("distance");
  await expect(cards(page).first()).toContainText("Alpha");
  await expect(page.locator("#message")).toContainText("straight-line");
  expect(page.url()).not.toContain("23.760123");
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain("23.760123");
});
