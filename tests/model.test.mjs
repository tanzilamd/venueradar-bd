import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  sizeOf,
  filterVenues,
  distance,
  readIds,
  mapsURL,
} from "../src/model.js";
import { validateData } from "../scripts/validate.mjs";
export const fixture = (id = "bd-test") => ({
  id,
  city: "Dhaka",
  name: "TEST ONLY Hall",
  bn_name: "পরীক্ষার স্থান",
  aliases: ["Test alternative"],
  category: "Event Hall",
  division: "6",
  district: "47",
  area: "Test area",
  address: "Test address, Bangladesh",
  coordinates: { lat: 23.8, lon: 90.4 },
  phones: [
    {
      number: "+8801712345678",
      source: "https://example.org/test-only",
      checked: "2026-10-25",
      status: "published-not-call-tested",
    },
  ],
  website: null,
  capacity: 1200,
  capacity_layout: "test seating",
  facilities: ["Parking"],
  verification: "source-checked",
  last_checked: "2026-10-25",
  evidence: [
    {
      url: "https://example.org/test-only",
      fields: [
        "name",
        "address",
        "category",
        "coordinates",
        "capacity",
        "facilities.Parking",
        "phones",
      ],
      checked: "2026-10-25",
      kind: "official",
      reuse: "Synthetic test fixture only",
    },
  ],
  notes: "TEST ONLY — never production data",
});
test("capacity thresholds and unknowns", () =>
  assert.deepEqual([null, 299, 300, 999, 1000].map(sizeOf), [
    "Unknown",
    "Small",
    "Medium",
    "Medium",
    "Large",
  ]));
test("Bengali, English, aliases, hierarchical and factual filters", () => {
  const v = fixture();
  for (const search of ["পরীক্ষার", "TEST ONLY", "alternative"])
    assert.equal(filterVenues([v], { search }).length, 1);
  for (const f of [
    { division: "1" },
    { district: "1" },
    { size: "Small" },
    { area: "Elsewhere" },
    { verified: true },
  ])
    assert.equal(filterVenues([v], f).length, 0);
  assert.equal(
    filterVenues([v], {
      phone: true,
      parking: true,
      capacity: true,
      size: "Large",
    }).length,
    1,
  );
});
test("missing information is never treated as confirmed", () => {
  const v = {
    ...fixture(),
    phones: [],
    capacity: null,
    facilities: [],
    coordinates: null,
  };
  for (const f of [{ phone: true }, { parking: true }, { capacity: true }])
    assert.equal(filterVenues([v], f).length, 0);
  assert.equal(filterVenues([v], { size: "Unknown" }).length, 1);
});
test("straight-line distance and sorting", () => {
  assert.equal(distance({ lat: 23, lon: 90 }, { lat: 23, lon: 90 }), 0);
  const a = fixture(),
    b = { ...fixture("bd-far"), coordinates: { lat: 25, lon: 91 } };
  assert.equal(
    filterVenues([b, a], { sort: "distance" }, { lat: 23.8, lon: 90.4 })[0].id,
    a.id,
  );
});
test("storage rejects corruption, removed records, duplicates", () => {
  assert.deepEqual(readIds({ getItem: () => "{bad" }, "x", new Set()), []);
  assert.deepEqual(
    readIds(
      { getItem: () => JSON.stringify(["a", "a", "old", null]) },
      "x",
      new Set(["a"]),
    ),
    ["a"],
  );
});
test("maps URL safely encodes venue query", () => {
  assert.ok(
    mapsURL(fixture()).startsWith(
      "https://www.google.com/maps/search/?api=1&query=",
    ),
  );
});
test("schema, evidence, administrative and duplicate validation", () => {
  const areas = JSON.parse(
      fs.readFileSync("docs/reference/bangladesh-areas.json"),
    ),
    schema = JSON.parse(fs.readFileSync("schemas/venue.schema.json"));
  const v = fixture();
  v.district = areas.districts.find((d) => d.division_id === v.division).id;
  assert.deepEqual(validateData([v], areas, schema), []);
  assert.ok(
    validateData([{ ...v, coordinates: { lat: 0, lon: 0 } }], areas, schema)
      .length,
  );
  assert.ok(validateData([v, v], areas, schema).length);
  assert.ok(
    validateData(
      [{ ...v, evidence: [{ ...v.evidence[0], fields: ["name"] }] }],
      areas,
      schema,
    ).length,
  );
});
test("published capacity ranges remain ranges in filters and classification", async () => {
  const { capacityText, hasCapacity } = await import("../src/model.js");
  const v = {
    ...fixture(),
    capacity: null,
    capacity_range: { min: 400, max: 500 },
  };
  assert.equal(capacityText(v), "400–500 people");
  assert.equal(hasCapacity(v), true);
  assert.equal(sizeOf(null, v.capacity_range), "Medium");
  assert.equal(sizeOf(null, { min: 250, max: 350 }), "Unknown");
  assert.equal(filterVenues([v], { capacity: true, size: "Medium" }).length, 1);
  const areas = JSON.parse(
      fs.readFileSync("docs/reference/bangladesh-areas.json"),
    ),
    schema = JSON.parse(fs.readFileSync("schemas/venue.schema.json"));
  v.district = areas.districts.find((d) => d.division_id === v.division).id;
  v.evidence[0].fields.push("capacity_range");
  assert.deepEqual(validateData([v], areas, schema), []);
  assert.ok(
    validateData(
      [{ ...v, capacity_range: { min: 500, max: 400 } }],
      areas,
      schema,
    ).length,
  );
  assert.ok(validateData([{ ...v, capacity: 500 }], areas, schema).length);
});
test("collection, source-confidence and unknown-area filters remain independent", () => {
  const operator = fixture(),
    mapped = {
      ...fixture("bd-mapped"),
      area: null,
      verification: "open-data-listed",
      evidence: [{ kind: "open-data" }],
    };
  assert.equal(
    filterVenues([operator, mapped], { collectionIds: [mapped.id] }).length,
    1,
  );
  assert.equal(
    filterVenues([operator, mapped], { evidence: "operator" })[0].id,
    operator.id,
  );
  assert.equal(
    filterVenues([operator, mapped], { evidence: "mapped" })[0].id,
    mapped.id,
  );
  assert.equal(
    filterVenues([operator, mapped], { area: "__unknown__" })[0].id,
    mapped.id,
  );
});
test("bulk mapped records are spatially scoped, uniquely sourced and not hotel additions", async () => {
  const { inBoundary } = await import("../src/geo.js");
  const venues = JSON.parse(fs.readFileSync("public/data/venues.json")),
    boundary = JSON.parse(
      fs.readFileSync("public/data/dhaka-boundary.geojson"),
    );
  const mapped = venues.filter((v) => v.verification === "open-data-listed");
  assert.equal(mapped.length, 107);
  assert.ok(mapped.every((v) => inBoundary(v.coordinates, boundary)));
  assert.ok(
    mapped.every(
      (v) => v.discovery && v.evidence.some((e) => e.kind === "open-data"),
    ),
  );
  assert.ok(mapped.every((v) => !v.name.toLowerCase().includes("hotel")));
  assert.equal(
    new Set(mapped.map((v) => v.evidence[0].url)).size,
    mapped.length,
  );
  assert.equal(inBoundary({ lat: 24.1, lon: 90.4 }, boundary), false);
  assert.equal(inBoundary({ lat: 23.83, lon: 90.75 }, boundary), false);
  const areas = JSON.parse(
      fs.readFileSync("docs/reference/bangladesh-areas.json"),
    ),
    schema = JSON.parse(fs.readFileSync("schemas/venue.schema.json"));
  assert.ok(
    validateData(
      [{ ...mapped[0], coordinates: { lat: 24.1, lon: 90.4 } }],
      areas,
      schema,
      boundary,
    ).length,
  );
});
test("Maps searches omit missing-address explanatory text", () => {
  const v = {
    ...fixture(),
    address_status: "not_available",
    address: "Dhaka — street address not supplied in the map listing.",
  };
  assert.ok(!decodeURIComponent(mapsURL(v)).includes("not supplied"));
  assert.ok(decodeURIComponent(mapsURL(v)).includes("Dhaka"));
});
