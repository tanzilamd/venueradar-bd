import fs from "node:fs";
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const real = JSON.parse(fs.readFileSync("public/data/venues.json"));
const v = { ...structuredClone(real.find((v2) => v2.phones.length && !v2.review_notice)), id: "bd-test-editor", name: "TEST ONLY Editable Hall", area: "Khilgaon" };
async function load(page) {
  await page.route("**/data/venues.json", (r) => r.fulfill({ json: [v] }));
  await page.goto("/manage.html");
  await expect(page.locator("#adminList button")).toHaveCount(1);
}
test("owner can add/edit/remove and restore a draft without touching JSON", async ({ page }) => {
  await load(page);
  await page.locator("#adminList button").click();
  await page.locator("#editPhones").fill("01712345678, 02-48321499");
  await page.locator("#editSource").fill("https://example.org/test-only");
  await page.getByRole("button", { name: "Save to draft", exact: true }).click();
  await expect(page.locator("#changeSummary")).toContainText("1 edited");
  await page.reload();
  await expect(page.locator("#adminMessage")).toContainText("draft has been restored");
  await page.locator("#adminList button").click();
  await expect(page.locator("#editPhones")).toHaveValue("+8801712345678\n+880248321499");
  page.on("dialog", (d) => d.accept());
  await page.locator("#deleteVenue").click();
  await expect(page.locator("#changeSummary")).toContainText("1 removed");
  await page.locator("#discardDraft").click();
  await expect(page.locator("#adminList button")).toHaveCount(1);
});
test("invalid source/phone cannot create a workflow-breaking draft", async ({ page }) => {
  await load(page);
  await page.locator("#adminList button").click();
  await page.locator("#editPhones").fill("018-774550");
  await page.getByRole("button", { name: "Save to draft", exact: true }).click();
  await expect(page.locator("#formError")).toContainText("Invalid Bangladesh phone");
  await expect(page.locator("#changeSummary")).toHaveText("No changes yet.");
});
test("manager finds review notices and clears one only after source confirmation", async ({ page }) => {
  const flagged = real.find((row) => row.review_notice && row.verification !== "user-submitted");
  await page.route("**/data/venues.json", (r) => r.fulfill({ json: [v, flagged] }));
  await page.goto("/manage.html");
  await page.locator("#reviewOnly").check();
  await expect(page.locator("#adminList button")).toHaveCount(1);
  await expect(page.locator("#adminList button")).toContainText("Needs review");
  await page.locator("#adminList button").click();
  await expect(page.locator("#existingNotice")).toHaveText(flagged.review_notice);
  await expect(page.locator("#editSource")).toBeEmpty();
  await page.locator("#editNotice").fill("");
  await page.locator("#editSource").fill("https://example.org/checked-business");
  await page.getByRole("button", { name: "Save to draft", exact: true }).click();
  await expect(page.locator("#formError")).toContainText("confirmation checkbox");
  await page.locator("#editConfirmNotice").check();
  await page.getByRole("button", { name: "Save to draft", exact: true }).click();
  await expect(page.locator("#changeSummary")).toContainText("1 edited");
  await expect(page.locator("#adminList button")).toHaveCount(0);
  const download = page.waitForEvent("download");
  await page.locator("#exportData").click();
  const file = await download;
  const saved = JSON.parse(fs.readFileSync(await file.path(), "utf8")).find((row) => row.id === flagged.id);
  expect(saved.review_notice).toBeUndefined();
  expect(saved.evidence).toContainEqual(expect.objectContaining({ url: "https://example.org/checked-business" }));
});
test("new hall previews and exports a valid single JSON file", async ({ page }) => {
  await load(page);
  await page.locator("#newVenue").click();
  await page.locator("#editName").fill("TEST ONLY New Hall");
  await page.locator("#editArea").fill("Rampura");
  await page.locator("#editAddress").fill("House1, Road1, Rampura, Dhaka");
  await page.locator("#editPhones").fill("01712345678");
  await page.locator("#editMaps").fill("https://www.google.com/maps/search/?api=1&query=TEST");
  await page.locator("#editSource").fill("https://example.org/test-only");
  await page.getByRole("button", { name: "Save to draft", exact: true }).click();
  await expect(page.locator("#changeSummary")).toContainText("1 added");
  const d = page.waitForEvent("download");
  await page.locator("#exportData").click();
  const file = await d;
  expect(file.suggestedFilename()).toBe("venues.json");
  const json = JSON.parse(fs.readFileSync(await file.path(), "utf8"));
  expect(json).toHaveLength(2);
  expect(json[1].phones[0].number).toBe("+8801712345678");
});
test("manager is accessible and mobile form has no horizontal overflow", async ({ page }) => {
  await load(page);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.setViewportSize({ width: 360, height: 800 });
  await page.locator("#adminList button").click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: "test-results/manager-mobile.png" });
});
test("GitHub access token is never persisted in browser storage", async ({ page }) => {
  await load(page);
  await page.route("https://api.github.com/**", (r) => {
    const path = new URL(r.request().url()).pathname;
    if (path === "/user") return r.fulfill({ json: { login: "tanzilamd" } });
    return r.fulfill({ json: { content: Buffer.from(JSON.stringify([v])).toString("base64") } });
  });
  await page.locator("#githubAccess").evaluate((n) => n.open = true);
  await page.locator("#githubToken").fill("TEST_ONLY_TOKEN");
  await page.locator("#connectGithub").click();
  await expect(page.locator("#githubStatus")).toContainText("Connected as tanzilamd");
  expect(await page.evaluate(() => JSON.stringify(localStorage) + JSON.stringify(sessionStorage))).not.toContain("TEST_ONLY_TOKEN");
  await expect(page.locator("#githubToken")).toHaveValue("");
});
test("older draft can be downloaded when newer published data exists", async ({ page }) => {
  await page.addInitScript(({ row }) => {
    localStorage.setItem("vr-admin-draft-v1", JSON.stringify({ baseline: [], rows: [row] }));
  }, { row: v });
  await load(page);
  await expect(page.locator("#adminMessage")).toContainText("Your older draft is preserved");
  await expect(page.locator("#recoverDraft")).toBeVisible();
  const done = page.waitForEvent("download");
  await page.locator("#recoverDraft").click();
  expect((await done).suggestedFilename()).toBe("venues-older-draft.json");
});
