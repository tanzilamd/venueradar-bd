import fs from "node:fs";
import Ajv from "ajv";
import { inBoundary } from "../src/geo.js";
import { normalize, distance } from "../src/model.js";
const read = (n) => JSON.parse(fs.readFileSync(n, "utf8"));
export function validateData(venues, areas, schema, boundary) {
  const errors = [];
  const valid = new Ajv({ allErrors: true }).compile(schema);
  if (!valid(venues))
    return valid.errors.map((e) => `${e.instancePath}: ${e.message}`);
  const seen = /* @__PURE__ */ new Set();
  for (const v of venues) {
    if (seen.has(v.id)) errors.push(`Duplicate ID ${v.id}`);
    seen.add(v.id);
    if (v.verification !== "user-submitted" && v.evidence.every((e) => e.kind === "submission"))
      errors.push(`${v.id}: submission status cannot be upgraded without independent source evidence`);
    if (v.verification === "user-submitted") {
      if (!v.review_notice || !v.evidence.some((e) => e.kind === "submission"))
        errors.push(`${v.id}: submissions require a visible notice and submission provenance`);
      if (v.phones.some((p) => p.status !== "submitted-not-verified"))
        errors.push(`${v.id}: submitted contacts cannot claim published verification`);
    } else if (v.phones.some((p) => p.status === "submitted-not-verified")) {
      errors.push(`${v.id}: unverified submitted contacts require submission status`);
    }
    if (v.phone_review && (v.phones.length || !Number.isFinite(Date.parse(v.phone_review.checked)) || v.phone_review.checked > new Date().toISOString().slice(0, 10)))
      errors.push(`${v.id}: invalid missing-phone review metadata`);
    if (v.coordinates && boundary && !inBoundary(v.coordinates, boundary))
      errors.push(`${v.id}: coordinates outside Dhaka boundary`);
    if (v.verification === "open-data-listed") {
      if (!v.discovery || !v.evidence.some((e) => e.kind === "open-data"))
        errors.push(`${v.id}: map provenance missing`);
      if (!v.coordinates || !boundary || !inBoundary(v.coordinates, boundary))
        errors.push(`${v.id}: mapped venue outside Dhaka boundary`);
      if (v.discovery && !v.evidence.some(
        (e) => e.url === `https://www.openstreetmap.org/${v.discovery.element_type}/${v.discovery.element_id}`
      ))
        errors.push(`${v.id}: source identity mismatch`);
    }
    if (v.capacity_range && (v.capacity != null || v.capacity_range.min > v.capacity_range.max))
      errors.push(`${v.id}: invalid or ambiguous capacity range`);
    const district = areas.districts.find((d) => d.id === v.district);
    if (!district || district.division_id !== v.division)
      errors.push(`${v.id}: district/division mismatch`);
    for (const field of [
      "name",
      "address",
      "category",
      ...v.coordinates ? ["coordinates"] : [],
      ...v.capacity ? ["capacity"] : [],
      ...v.capacity_range ? ["capacity_range"] : [],
      ...v.review_notice ? ["review_notice"] : [],
      ...v.facilities.map((f) => "facilities." + f)
    ])
      if (!v.evidence.some((e) => e.fields.includes(field)))
        errors.push(`${v.id}: unsupported ${field}`);
    for (const p of v.phones)
      if (!v.evidence.some(
        (e) => e.url === p.source && e.fields.includes("phones")
      ))
        errors.push(`${v.id}: unsupported phone`);
    for (const field of ["capacity_note", "contact_hours", "catering_policy"]) {
      const fact = v[field];
      if (fact && !v.evidence.some((e) => e.url === fact.source && e.kind === "official" && e.fields.includes(field)))
        errors.push(`${v.id}: ${field} requires matching operator evidence`);
      if (fact && (!Number.isFinite(Date.parse(fact.checked)) || fact.checked > (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)))
        errors.push(`${v.id}: invalid ${field} review date`);
    }
    if (v.verification === "cross-checked" && new Set(v.evidence.map((e) => new URL(e.url).hostname)).size < 2)
      errors.push(`${v.id}: cross-check requires independent sources`);
    for (const s of v.evidence) {
      try {
        const u = new URL(s.url);
        if (u.protocol !== "https:" || u.username || u.password) throw Error();
      } catch {
        errors.push(`${v.id}: invalid source URL`);
      }
      if (!Number.isFinite(Date.parse(s.checked)) || s.checked > (/* @__PURE__ */ new Date()).toISOString().slice(0, 10))
        errors.push(`${v.id}: invalid evidence date`);
    }
    for (const other of venues.filter(
      (x) => x.id !== v.id && x.district === v.district
    )) {
      if (normalize(other.name) === normalize(v.name) || other.coordinates && v.coordinates && distance(other.coordinates, v.coordinates) < 0.05 && normalize(other.name).includes(normalize(v.name)))
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
    read("public/data/dhaka-boundary.geojson")
  );
  const collections = read("public/data/collections.json");
  const validIds = new Set(venues.map((v) => v.id)), membership = /* @__PURE__ */ new Set();
  for (const group of collections.groups)
    for (const id of group.venue_ids) {
      if (!validIds.has(id) || membership.has(id))
        errors.push(`Invalid or duplicate collection member ${id}`);
      membership.add(id);
    }
  if (membership.size !== validIds.size)
    errors.push("Collection membership is incomplete");
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
  } else
    console.log(
      `Validated ${venues.length} venue records. ${venues.length ? "Manual evidence review still required." : "EMPTY DATASET: not production-ready."}`
    );
  if (process.argv.includes("--production") && !venues.length) {
    console.error("Production requires researched venue records.");
    process.exitCode = 1;
  }
}
