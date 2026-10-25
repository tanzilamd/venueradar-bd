import fs from "node:fs";
import Ajv from "ajv";
import { normalize, distance } from "../src/model.js";
const read = (n) => JSON.parse(fs.readFileSync(n, "utf8"));
export function validateData(venues, areas, schema) {
  const errors = [];
  const valid = new Ajv({ allErrors: true }).compile(schema);
  if (!valid(venues))
    return valid.errors.map((e) => `${e.instancePath}: ${e.message}`);
  const seen = new Set();
  for (const v of venues) {
    if (seen.has(v.id)) errors.push(`Duplicate ID ${v.id}`);
    seen.add(v.id);
    if (
      v.capacity_range &&
      (v.capacity != null || v.capacity_range.min > v.capacity_range.max)
    )
      errors.push(`${v.id}: invalid or ambiguous capacity range`);
    const district = areas.districts.find((d) => d.id === v.district);
    if (!district || district.division_id !== v.division)
      errors.push(`${v.id}: district/division mismatch`);
    for (const field of [
      "name",
      "address",
      "category",
      ...(v.coordinates ? ["coordinates"] : []),
      ...(v.capacity ? ["capacity"] : []),
      ...(v.capacity_range ? ["capacity_range"] : []),
      ...v.facilities.map((f) => "facilities." + f),
    ])
      if (!v.evidence.some((e) => e.fields.includes(field)))
        errors.push(`${v.id}: unsupported ${field}`);
    for (const p of v.phones)
      if (
        !v.evidence.some(
          (e) => e.url === p.source && e.fields.includes("phones"),
        )
      )
        errors.push(`${v.id}: unsupported phone`);
    if (
      v.verification === "cross-checked" &&
      new Set(v.evidence.map((e) => new URL(e.url).hostname)).size < 2
    )
      errors.push(`${v.id}: cross-check requires independent sources`);
    for (const s of v.evidence) {
      try {
        const u = new URL(s.url);
        if (u.protocol !== "https:" || u.username || u.password) throw Error();
      } catch {
        errors.push(`${v.id}: invalid source URL`);
      }
      if (
        !Number.isFinite(Date.parse(s.checked)) ||
        s.checked > new Date().toISOString().slice(0, 10)
      )
        errors.push(`${v.id}: invalid evidence date`);
    }
    for (const other of venues.filter(
      (x) => x.id !== v.id && x.district === v.district,
    )) {
      if (
        normalize(other.name) === normalize(v.name) ||
        (other.coordinates &&
          v.coordinates &&
          distance(other.coordinates, v.coordinates) < 0.05 &&
          normalize(other.name).includes(normalize(v.name)))
      )
        errors.push(`Probable duplicate ${v.id}/${other.id}`);
    }
  }
  return [...new Set(errors)];
}
if (process.argv[1]?.endsWith("validate.mjs")) {
  const venues = read("public/data/venues.json");
  const errors = validateData(
    venues,
    read("docs/reference/bangladesh-areas.json"),
    read("schemas/venue.schema.json"),
  );
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
  } else
    console.log(
      `Validated ${venues.length} venue records. ${venues.length ? "Manual evidence review still required." : "EMPTY DATASET: not production-ready."}`,
    );
  if (process.argv.includes("--production") && !venues.length) {
    console.error("Production requires researched venue records.");
    process.exitCode = 1;
  }
}
