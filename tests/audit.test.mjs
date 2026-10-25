import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { matchesSearch } from "../src/search.js";
import { readURL, stateURL, defaultFilters } from "../src/state.js";
import { filterVenues } from "../src/model.js";
import { validateData } from "../scripts/validate.mjs";
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const venues = read("public/data/venues.json");
test("curated locality aliases agree; short AK cannot match Dhaka", () => {
  const ids = (q) => venues.filter((v) => matchesSearch(v, q)).map((v) => v.id);
  assert.deepEqual(ids("\u09AC\u09A8\u09B6\u09CD\u09B0\u09C0"), ids("Banasree"));
  assert.deepEqual(ids("Banasri"), ids("Banasree"));
  assert.deepEqual(ids("AK"), ["bd-ak-convention-center"]);
});
test("shared state validates IDs and filters, restores details and excludes geolocation", () => {
  const state = { tab: "shared", filters: { ...defaultFilters("shared"), area: "Khilgaon", phone: true, includeNearby: false }, view: "map", detailId: venues[0].id, sharedIds: [venues[0].id], locationPoint: { lat: 23.760123, lon: 90.420456 } };
  const url = stateURL("https://example.org/venueradar-bd/", state);
  assert.ok(!url.includes("23.760123"));
  const restored = readURL(url, new Set(venues.map((v) => v.id)));
  const { locationPoint, ...publicState } = state;
  assert.deepEqual(restored, publicState);
});
test("untrusted query state cannot introduce a category or unknown shared records", () => {
  const state = readURL("https://example.org/?list=removed,removed&type=anything&size=huge&status=open&sort=rating", /* @__PURE__ */ new Set());
  assert.equal(state.filters.category, "");
  assert.equal(state.filters.size, "");
  assert.equal(state.filters.reviewStatus, "all");
  assert.equal(state.filters.sort, "name");
  assert.deepEqual(state.sharedIds, []);
});
test("listing notices remain last without implying operating status", () => {
  const rows = [{ ...venues[0], id: "flag", name: "Aardvark", review_notice: "Needs identity confirmation" }, { ...venues[0], id: "plain", name: "Zebra" }];
  assert.equal(filterVenues(rows, { sort: "name" })[1].id, "flag");
  assert.deepEqual(filterVenues(rows, { reviewStatus: "no-notice" }).map((v) => v.id), ["plain"]);
});
test("qualified claims and hours require matching first-party evidence", () => {
  const areas = read("docs/reference/bangladesh-areas.json"), schema = read("schemas/venue.schema.json");
  const original = venues.find((v) => v.contact_hours);
  const altered = structuredClone(original);
  altered.contact_hours.source = "https://example.org/not-the-operator";
  assert.ok(validateData([altered], areas, schema).some((e) => e.includes("matching operator evidence")));
  const range = venues.find((v) => v.capacity_note);
  assert.equal(range.capacity, null);
  assert.ok(!range.capacity_range);
});
test("record review inventory and preserved sourced contacts cannot silently disappear", () => {
  const ledger = read("docs/research/2026-10-26-venue-review.json");
  assert.equal(ledger.records.length, 131);
  assert.equal(ledger.complete, false);
  for (const row of ledger.records) {
    assert.ok(venues.some((v) => v.id === row.id));
    assert.ok(row.sources_checked.length);
    assert.notEqual(row.status, "pending");
  }
  for (const change of read("docs/research/2026-10-26-field-changes.json")) {
    const current = venues.find((v) => v.id === change.id);
    assert.ok(current);
    for (const old of change.fields.phones?.before || []) assert.ok(current.phones.some((p) => JSON.stringify(p) === JSON.stringify(old)), change.id + " lost published contact history");
    for (const old of change.fields.facilities?.before || []) assert.ok(current.facilities.includes(old), change.id + " lost supported amenity");
  }
});
