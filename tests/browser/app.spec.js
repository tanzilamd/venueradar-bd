import fs from "node:fs";
import { test, expect } from "@playwright/test";
const catalog = JSON.parse(
  fs.readFileSync("public/data/collections.json", "utf8"),
);
const defaultCount = catalog.groups.find((g) => g.id === catalog.default)
  .venue_ids.length;
const productionVenues = JSON.parse(fs.readFileSync("public/data/venues.json", "utf8"));
const neighborhoodCount = JSON.parse(
  fs.readFileSync("public/data/areas.json", "utf8"),
).neighborhoods.length;
async function mockCollection(page, rows) {
  await page.route("**/data/collections.json", (r) =>
    r.fulfill({
      json: {
        default: "community-halls",
        groups: [
          {
            id: "community-halls",
            label: "Community centers & halls",
            venue_ids: rows.map((v) => v.id),
          },
          { id: "hotels", label: "Hotel venues", venue_ids: [] },
        ],
      },
    }),
  );
}
const make = (id, name, capacity) => ({
  id,
  city: "Dhaka",
  name,
  bn_name: null,
  aliases: ["বিয়ের স্থান"],
  category: "Event Hall",
  division: "6",
  district: "47",
  area: "Test area",
  address: "Test address",
  coordinates: { lat: 23.8 + capacity / 100000, lon: 90.4 },
  phones: [
    {
      number: "+8801712345678",
      source: "https://example.org",
      checked: "2026-10-25",
      status: "published-not-call-tested",
    },
  ],
  capacity,
  capacity_layout: "seated",
  facilities: ["Parking"],
  website: "https://example.org",
  verification: "source-checked",
  last_checked: "2026-10-25",
  evidence: [
    {
      url: "https://example.org",
      fields: ["name"],
      checked: "2026-10-25",
      kind: "official",
    },
  ],
  notes: null,
});
const records = [
  make("bd-test-a", "TEST ONLY Alpha", 1200),
  make("bd-test-b", "TEST ONLY Beta", 200),
];
test("empty state and Dhaka neighborhoods", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/data/venues.json", (route) =>
    route.fulfill({ json: [] }),
  );
  await page.goto("/");
  await expect(page.locator("#results")).toContainText("Research first");
  await expect(page.locator("#area option")).toHaveCount(neighborhoodCount + 1);
  await page.locator("#method").click();
  await expect(page.locator("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  expect(errors).toEqual([]);
});
test("fixture-only discovery, details, favorites persistence, compare and map", async ({
  page,
  context,
}) => {
  await page.route("**/data/venues.json", (route) =>
    route.fulfill({ json: records }),
  );
  await mockCollection(page, records);
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: 23.8, longitude: 90.4 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator(".card")).toHaveCount(2);
  await page.locator("#search").fill("বিয়ের");
  await expect(page.locator(".card")).toHaveCount(2);
  await page.locator("#size").selectOption("Large");
  await expect(page.locator(".card")).toHaveCount(1);
  await page.locator(".save").click();
  await page.reload();
  await expect(page.locator("#savedCount")).toHaveText("1");
  await page.locator("#saved").click();
  await expect(page.locator(".card")).toHaveCount(1);
  await page.locator("#reset").click();
  await page
    .getByRole("button", { name: "Compare +", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Compare +", exact: true })
    .last()
    .click();
  await page.locator("#openCompare").click();
  await expect(page.locator("table")).toContainText("TEST ONLY Alpha");
  await expect(page.locator("table")).toContainText("TEST ONLY Beta");
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "View details", exact: true })
    .first()
    .click();
  await expect(page.locator('dialog a[href^="tel:"]')).toHaveAttribute(
    "href",
    "tel:+8801712345678",
  );
  await page.keyboard.press("Escape");
  await page.locator("#mapView").click();
  await expect(page.locator(".venue-marker")).toHaveCount(2);
  await page.locator(".venue-marker").first().click();
  await expect(page.locator(".card.selected")).toHaveCount(1);
  await page.locator("#nearby").click();
  await expect(page.locator("#message")).toContainText("straight-line");
  await page.locator("#search").fill("no match");
  await expect(page.locator("#results")).toContainText("No venues match");
  expect(errors).toEqual([]);
});
for (const width of [360, 768, 1366, 1920])
  test(`layout ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.locator(".card")).toHaveCount(defaultCount);
    await expect(page.locator("#includeNearby")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await page.screenshot({
      path: `test-results/layout-${width}.png`,
      fullPage: true,
    });
  });
test("English-only real records and neighborhood filters", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".card")).toHaveCount(defaultCount);
  expect(await page.locator("body").innerText()).not.toMatch(/[\u0980-\u09ff]/);
  await page.locator("#collection").selectOption("hotels");
  await page.locator("#area").selectOption("Banani");
  await expect(page.locator(".card")).toHaveCount(1);
  await expect(page.locator(".card")).toContainText("Sheraton Dhaka");
  await page.locator("#category").selectOption("Community Center");
  await expect(page.locator("#results")).toContainText("No venues match");
  await page.locator("#reset").click();
  await page
    .getByRole("button", { name: "View details", exact: true })
    .first()
    .click();
  expect(await page.locator("dialog").innerText()).not.toMatch(
    /[\u0980-\u09ff]/,
  );
});
test("clustered markers and failed map tile fallback", async ({ page }) => {
  const same = records.map((v) => ({
    ...v,
    coordinates: { lat: 23.8, lon: 90.4 },
  }));
  await page.route("**/data/venues.json", (r) => r.fulfill({ json: same }));
  await mockCollection(page, same);
  await page.route("https://tile.openstreetmap.org/**", (r) => r.abort());
  await page.goto("/");
  await page.locator("#mapView").click();
  await expect(page.locator(".marker-cluster").first()).toBeVisible();
  await expect(page.locator("#message")).toContainText(
    "Map tiles could not load",
  );
  await expect(page.locator(".card")).toHaveCount(2);
});
test("location denied has useful fallback", async ({ page, context }) => {
  await context.clearPermissions();
  await page.goto("/");
  await page.locator("#nearby").click();
  await expect(page.locator("#message")).toContainText(
    "could not get your location",
    { timeout: 15000 },
  );
  await expect(page.locator("#nearby")).toBeEnabled();
});
test("independent convention halls expose sources, calls and honest capacity ranges", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#evidence").selectOption("operator");
  await page.locator("#category").selectOption("Convention Center");
  const expected = productionVenues.filter(v =>
    catalog.groups.find(g => g.id === catalog.default).venue_ids.includes(v.id) &&
    v.category === "Convention Center" && v.evidence.some(e => e.kind === "official")
  ).length;
  await expect(page.locator(".card")).toHaveCount(expected);
  await page.locator("#includeNearby").uncheck();
  await page.locator("#area").selectOption("Eskaton");
  await expect(page.locator(".card")).toContainText("Police Convention Hall");
  await expect(page.locator(".card")).toContainText("800 people");
  await page.getByRole("button", { name: "View details", exact: true }).click();
  await expect(
    page.locator('dialog a[href="tel:+8801789376469"]'),
  ).toBeVisible();
  await expect(page.locator("dialog")).toContainText(
    "conflicting digit counts",
  );
  await page.keyboard.press("Escape");
  await page.locator("#reset").click();
  await page.locator("#search").fill("SKS Convention");
  await expect(page.locator(".card")).toContainText("400–500 people");
  await page.locator("#capacity").check();
  await expect(page.locator(".card")).toHaveCount(1);
  await page.getByRole("button", { name: "View details", exact: true }).click();
  await expect(page.locator("dialog")).toContainText("400–500 people");
  await expect(page.locator("dialog")).toContainText(
    "https://senakalyan.org/dynamic_page/load_page/43",
  );
  expect(await page.locator("dialog").innerText()).not.toMatch(
    /[\u0980-\u09ff]/,
  );
});
test("bulk hall collection defaults to non-hotels and exposes map-source uncertainty", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".card")).toHaveCount(defaultCount);
  await expect(page.locator("#results")).not.toContainText("The Westin Dhaka");
  await page.locator("#evidence").selectOption("mapped");
  await expect(page.locator(".card")).toHaveCount(110);
  await page.locator("#search").fill("Sutrapur");
  await expect(page.locator(".card")).toHaveCount(1);
  await expect(page.locator(".card")).toContainText(
    "Map listing · confirm wedding booking",
  );
  await page.getByRole("button", { name: "View details", exact: true }).click();
  await expect(page.locator("dialog")).toContainText("not operator-confirmed");
  await expect(page.locator("dialog")).toContainText("Map record last edited");
  await page.keyboard.press("Escape");
  await page.locator("#reset").click();
  await expect(page.locator('#area option[value="__unknown__"]')).toHaveCount(
    0,
  );
  await page.locator("#reset").click();
  await page.locator("#collection").selectOption("hotels");
  await expect(page.locator(".card")).toHaveCount(8);
  await expect(page.locator("#results")).toContainText("The Westin Dhaka");
});
test("saved hotel venues remain reachable after the hall-first default is restored", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#collection").selectOption("hotels");
  await page.locator("#search").fill("Sheraton");
  await page.locator(".save").click();
  await page.reload();
  await expect(page.locator("#collection")).toHaveValue("community-halls");
  await page.locator("#saved").click();
  await expect(page.locator(".card")).toHaveCount(1);
  await expect(page.locator(".card")).toContainText("Sheraton Dhaka");
});
test("area-first shortcuts include nearby venues transparently and the research card is removed", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".card")).toHaveCount(defaultCount);
  await expect(page.locator("body")).not.toContainText("THE RESEARCH DESK");
  await expect(page.locator("#priorityAreas button")).toHaveCount(5);
  await page
    .locator("#priorityAreas button")
    .filter({ hasText: "Rampura" })
    .click();
  await expect(page.locator("#area")).toHaveValue("Rampura");
  await expect(page.locator('#priorityAreas button[data-area-choice="Rampura"]')).toBeFocused();
  await expect(page.locator("#resultLabel")).toContainText("nearby areas");
  await expect(page.locator("#results")).toContainText("Casanova Party Center");
  const casanova = page
    .locator(".card")
    .filter({ hasText: "Casanova Party Center" });
  await expect(casanova).toContainText("Banasree");
  await page.locator("#withPhone").click();
  await expect(page.locator("#withPhone")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  const count = await page.locator(".card").count();
  expect(count).toBeGreaterThan(0);
  await page.locator("#reset").click();
  await page.locator("#search").fill("Ladies Club");
  await expect(page.locator("#results")).toContainText("Eskaton");
  await page.locator("#search").fill("Officers");
  await expect(page.locator("#results")).toContainText("Officers' Club Dhaka");
});
test("researched contacts are visible, sourced and distinct from operator evidence", async ({page}) => {
  await page.goto('/');
  await page.locator('#search').fill('Abakas');
  await expect(page.locator('.card')).toHaveCount(1);
  await expect(page.locator('.card')).toContainText('Abacus Convention Center');
  await expect(page.locator('.card')).toContainText('Business listing checked');
  await expect(page.locator('.card a[href="tel:+880248321499"]')).toContainText('0248321499');
  await page.getByRole('button', {name:'View details',exact:true}).click();
  await expect(page.locator('dialog')).toContainText('line not call-tested');
  await expect(page.locator('dialog a[href="https://maps.app.goo.gl/TYbpPZTJ9amf3mzj8"]').first()).toBeVisible();
  await page.keyboard.press('Escape');
  await page.locator('#search').fill('Casanova');
  await expect(page.locator('.review-notice')).toContainText('Closure reported');
  await page.locator('#reset').click();
  await page.locator('#includeNearby').uncheck();
  await page.locator('#area').selectOption('Eskaton');
  const rows=productionVenues.filter(v=>v.area==='Eskaton' && catalog.groups.find(g=>g.id===catalog.default).venue_ids.includes(v.id));
  await expect(page.locator('.card')).toHaveCount(rows.length);
  await expect(page.locator('#results')).not.toContainText("Officers' Club Dhaka");
});
test('comparison aligns facts by label across different evidence and review notices', async ({page}) => {
  await page.goto('/');
  for(const search of ['Abakas','Casanova']) {
    await page.locator('#search').fill(search);
    await expect(page.locator('.card')).toHaveCount(1);
    await page.getByRole('button',{name:'Compare +',exact:true}).click();
  }
  await page.locator('#openCompare').click();
  const row = label => page.getByRole('row').filter({has: page.getByRole('rowheader',{name:label,exact:true})});
  await expect(row('Venue type').getByRole('cell')).toHaveText(['Convention Center','Event Hall']);
  await expect(row('Area').getByRole('cell')).toHaveText(['Eskaton','Banasree']);
  await expect(row('Phone').getByRole('cell').first()).toHaveText('+880248321499');
  await expect(row('Needs confirmation').getByRole('cell').first()).toHaveText('No notice recorded');
  await expect(row('Needs confirmation').getByRole('cell').nth(1)).toContainText('Closure reported');
});
