import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { matchesSearch } from "../src/search.js";
import { readURL, stateURL, defaultFilters } from "../src/state.js";
import { filterVenues, hasCapacity } from "../src/model.js";
import { validateData } from "../scripts/validate.mjs";
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const venues = read("public/data/venues.json");
test("curated locality aliases agree; short AK cannot match Dhaka", () => {
  const ids = (q) => venues.filter((v) => matchesSearch(v, q)).map((v) => v.id);
  assert.deepEqual(ids("\u09AC\u09A8\u09B6\u09CD\u09B0\u09C0"), ids("Banasree"));
  assert.deepEqual(ids("Banasri"), ids("Banasree"));
  assert.ok(matchesSearch({name:"AK Convention Center",aliases:[],area:"Banasree"},"AK"));
  assert.ok(!matchesSearch({name:"Dhaka Community Hall",aliases:[],area:"Dhaka"},"AK"));
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
  const altered = structuredClone(venues[0]);
  altered.contact_hours = {text:"TEST ONLY office hours",kind:"booking-office-hours",checked:"2026-10-25",source:"https://example.org/not-the-operator"};
  assert.ok(validateData([altered], areas, schema).some((e) => e.includes("matching operator evidence")));
  const qualified = {...venues[0], capacity:null, capacity_range:undefined, capacity_note:{text:"TEST ONLY combined floors claim"}};
  assert.equal(hasCapacity(qualified),false);
});
test("historical research remains documented without blocking intentional future edits", () => {
  const ledger = read("docs/research/2026-10-26-venue-review.json");
  assert.equal(new Set(ledger.records.map(r=>r.id)).size,ledger.records.length);
  for(const row of ledger.records){assert.ok(row.sources_checked.length);assert.notEqual(row.status,"pending");}
  for(const row of venues)for(const phone of row.phones)assert.ok(row.evidence.some(e=>e.url===phone.source&&e.fields.includes("phones")),row.id+" missing phone provenance");
});
test("contributor contacts stay visibly unverified and cannot become published evidence silently", () => {
  const submission = {...structuredClone(venues[0]), id:"bd-test-submission", area:null, verification:"user-submitted", review_notice:"TEST ONLY submission pending verification", phones:[{number:"+8801712345678",source:"https://example.org/test-only",checked:"2026-10-25",status:"submitted-not-verified"}]};
  submission.evidence = [{url:"https://example.org/test-only", fields:["name","address","category","phones","review_notice",...(submission.coordinates?["coordinates"]:[]),...(submission.capacity?["capacity"]:[]),...submission.facilities.map(f=>"facilities."+f)],kind:"submission",checked:"2026-10-25",reuse:"Synthetic validation fixture only."}];
  delete submission.contact_hours;delete submission.capacity_note;delete submission.catering_policy;delete submission.capacity_range;
  const areas = read("docs/reference/bangladesh-areas.json"), schema = read("schemas/venue.schema.json");
  assert.equal(submission.verification, "user-submitted");
  assert.equal(submission.area, null);
  assert.ok(submission.review_notice);
  assert.ok(submission.phones.every((p) => p.status === "submitted-not-verified"));
  assert.deepEqual(filterVenues([submission], { verified: true }), []);
  assert.deepEqual(validateData([submission], areas, schema), []);
  submission.phones[0].status = "published-not-call-tested";
  assert.ok(validateData([submission], areas, schema).some((e) => e.includes("cannot claim published verification")));
  submission.verification = "source-checked";
  assert.ok(validateData([submission], areas, schema).some((e) => e.includes("cannot be upgraded")));
});
