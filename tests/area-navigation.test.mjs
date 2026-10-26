import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { areaNames, areaCounts, nearbyNames } from "../src/filters.js";
import { filterVenues } from "../src/model.js";
import { matchesAreaQuery } from "../src/search.js";
import { defaultFilters, readURL, stateURL } from "../src/state.js";

const areas = JSON.parse(fs.readFileSync("public/data/areas.json"));
const venue = (id, area) => ({ id, area, name: id, phones: [], facilities: [] });

test("curated nearby links reference valid areas, are reciprocal and have no duplicates", () => {
  const names = new Set(areas.neighborhoods.map((a) => a.name));
  for (const [area, neighbors] of Object.entries(areas.nearby)) {
    assert.ok(names.has(area), area);
    assert.equal(neighbors.length, new Set(neighbors).size, area);
    assert.ok(!neighbors.includes(area), area);
    for (const neighbor of neighbors) {
      assert.ok(names.has(neighbor), neighbor);
      assert.ok(areas.nearby[neighbor]?.includes(area), `${area} / ${neighbor}`);
    }
  }
});

test("Paltan browsing keeps the same road corridor together and Motijheel is nearby in both directions", () => {
  const rows = [venue("bd-a", "Paltan"), venue("bd-b", "Naya Paltan"), venue("bd-c", "Motijheel"), venue("bd-d", "Uttara")];
  const result = (area, includeNearby) => filterVenues(rows, { area, areaIds: areaNames(area, includeNearby, areas) });
  assert.deepEqual(result("Paltan", false).map((v) => v.id), ["bd-a", "bd-b"]);
  assert.deepEqual(result("Naya Paltan", false).map((v) => v.id), ["bd-a", "bd-b"]);
  assert.deepEqual(result("Motijheel", false).map((v) => v.id), ["bd-c"]);
  assert.deepEqual(result("Motijheel", true).map((v) => v.id), ["bd-a", "bd-b", "bd-c"]);
  assert.equal(result("Naya Paltan", true).find((v) => v.id === "bd-c").area, "Motijheel");
  assert.deepEqual(areaCounts(rows, "Naya Paltan", areas), { exact: 2, nearby: 1 });
  assert.deepEqual(areaNames("Paltan", true, areas), areaNames("Naya Paltan", true, areas));
  assert.ok(!nearbyNames("Paltan", areas).includes("Naya Paltan"));
  assert.ok(matchesAreaQuery("Naya Paltan", "Noya Paltan"));
});

test("shared area links and reload preserve an explicit nearby selection", () => {
  for (const includeNearby of [false, true]) {
    const state = { tab: "explore", filters: { ...defaultFilters("explore"), area: "Motijheel", includeNearby }, view: "list" };
    const restored = readURL(stateURL("https://example.org/venueradar-bd/", state));
    assert.equal(restored.filters.area, "Motijheel");
    assert.equal(restored.filters.includeNearby, includeNearby);
  }
});
