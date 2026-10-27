import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { normalizePhone, editVenue, deriveCatalog, changeSet } from "../src/catalog-edit.js";
import { publishCatalog } from "../src/github-publish.js";
import { validateData } from "../src/data-validation.js";
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8")), current = read("public/data/venues.json"), schema = read("schemas/venue.schema.json"), regions = read("docs/reference/bangladesh-areas.json"), boundary = read("public/data/dhaka-boundary.geojson");
const base = () => ({ ...structuredClone(current[0]), id: "bd-test-only-editor", name: "TEST ONLY Editor Venue", area: "Khilgaon" });
const input = (v) => ({ id: v.id, name: v.name, area: v.area, address: v.address, addressStatus: "published", phones: "01712345678,02-48321499", maps: "https://www.google.com/maps/search/?api=1&query=TEST+ONLY", website: "", lat: v.coordinates?.lat ?? "", lon: v.coordinates?.lon ?? "", source: "https://example.org/test-only", sourceKind: "independent", notice: "" });
test("phone editing normalizes mobile and landline and clears stale missing-phone metadata", () => {
  const v = base();
  v.phones = [];
  v.phone_review = { status: "source-limited", checked: "2026-10-25", note: "Synthetic missing phone state." };
  const result = editVenue([v], input(v))[0];
  assert.deepEqual(result.phones.map((p) => p.number), ["+8801712345678", "+880248321499"]);
  assert.ok(!result.phone_review);
  assert.deepEqual(validateData([result], regions, schema, boundary), []);
  assert.throws(() => normalizePhone("018-774550"));
});
test("visual edits retain hidden facts and old evidence; unknown areas and collection membership rebuild", () => {
  const v = base(), form = input(v);
  form.area = "TEST ONLY Dhaka Area";
  const out = editVenue([v], form)[0];
  assert.deepEqual(out.facilities, v.facilities);
  for (const e of v.evidence) assert.ok(out.evidence.some((x) => JSON.stringify(x) === JSON.stringify(e)));
  const d = deriveCatalog([out], { default: "community-halls", groups: [{ id: "community-halls", venue_ids: ["removed"] }] }, { neighborhoods: [] });
  assert.deepEqual(d.collections.groups[0].venue_ids, [v.id]);
  assert.equal(d.areas.neighborhoods[0].name, form.area);
  assert.throws(() => editVenue([v], { ...form, maps: "javascript:alert(1)" }));
});
test("collection selection survives visual edits and rebuilds one membership", () => {
  const v = base(), form = { ...input(v), collection: "restaurant-party-centers" };
  const out = editVenue([v], form)[0];
  const catalog = deriveCatalog([out], { default: "community-halls", groups: [
    { id: "community-halls", venue_ids: [v.id] },
    { id: "restaurant-party-centers", venue_ids: [] },
    { id: "hotels", venue_ids: [] }
  ] }, { neighborhoods: [{ id: "1", name: "Khilgaon" }] });
  assert.equal(out.collection, "restaurant-party-centers");
  assert.deepEqual(catalog.collections.groups.map((g) => g.venue_ids), [[], [v.id], []]);
  assert.deepEqual(validateData([out], regions, schema, boundary), []);
  assert.throws(() => editVenue([v], { ...form, collection: "other" }), /valid collection/);
});
test("duplicate names are rejected and deletes are explicit change-set entries", () => {
  const v = base();
  assert.throws(() => editVenue([v], { ...input(v), id: "" }));
  assert.deepEqual(changeSet([v], []).removed, [v]);
});
test("review notices require an explicit public-source confirmation and retain prior evidence", () => {
  const v = base(), form = input(v);
  v.review_notice = "Confirm this venue's current details.";
  v.evidence.push({ url: "https://example.org/earlier-review", kind: "independent", checked: "2026-10-25", fields: ["review_notice"], reuse: "Synthetic test evidence." });
  assert.throws(() => editVenue([v], form), /confirmation checkbox/);
  assert.throws(() => editVenue([v], { ...form, confirmNotice: true, sourceKind: "submission" }), /public business source/);
  const result = editVenue([v], { ...form, confirmNotice: true })[0];
  assert.equal(result.review_notice, undefined);
  assert.ok(result.evidence.some((e) => e.url === "https://example.org/earlier-review"));
  assert.ok(result.evidence.some((e) => e.url === form.source && e.checked === result.last_checked));
  assert.deepEqual(validateData([result], regions, schema, boundary), []);
});
function apiMock(baseline, { conflict = false } = {}) {
  const calls = [];
  const fn = async (path, token, body, method) => {
    calls.push({ path, body, method });
    if (path === "/user") return { login: "tanzilamd" };
    if (path.endsWith("/git/ref/heads/main")) return { object: { sha: "head" } };
    if (path.includes("/contents/public/data/venues.json")) return { content: Buffer.from(JSON.stringify(conflict ? [] : baseline)).toString("base64") };
    if (path.endsWith("/git/commits/head")) return { tree: { sha: "base-tree" } };
    if (path.includes("/contents/docs/archive/venues.json")) {
      const e = Error("Not found");
      e.status = 404;
      throw e;
    }
    if (path.endsWith("/git/trees")) return { sha: "tree" };
    if (path.endsWith("/git/commits")) return { sha: "commit" };
    if (path.endsWith("/git/refs/heads/main")) return {};
    throw Error("Unexpected request " + path);
  };
  return { calls, fn };
}
const meta = { collections: { default: "community-halls", groups: [{ id: "community-halls", venue_ids: ["bd-test-only-editor"] }] }, areas: { neighborhoods: [{ id: "1", name: "Khilgaon" }] } };
test("publication uses one owner-attributed normal commit and archives removed records", async () => {
  const a = base(), b = { ...base(), id: "bd-test-second", name: "TEST ONLY Second" };
  const m = apiMock([a, b]);
  await publishCatalog({ token: "TEST_ONLY_TOKEN", baseline: [a, b], venues: [a], ...meta, request: m.fn });
  const tree = m.calls.find((c) => c.path.endsWith("/git/trees")).body;
  assert.ok(tree.tree.some((f) => f.path === "docs/archive/venues.json" && JSON.parse(f.content)[0].record.id === b.id));
  const commit = m.calls.find((c) => c.path.endsWith("/git/commits")).body;
  assert.equal(commit.author.email, "59307135+tanzilamd@users.noreply.github.com");
  assert.deepEqual(commit.parents, ["head"]);
  assert.equal(m.calls.at(-1).body.force, false);
  assert.equal(m.calls.at(-1).method, "PATCH");
});
test("concurrent repository changes stop publication before any mutation", async () => {
  const a = base(), m = apiMock([a], { conflict: true });
  await assert.rejects(publishCatalog({ token: "TEST_ONLY_TOKEN", baseline: [a], venues: [{ ...a, name: "TEST ONLY Changed" }], ...meta, request: m.fn }), /changed on GitHub/);
  assert.ok(m.calls.every((c) => !c.body));
});
