import fs from "node:fs";
import { validateData } from "../src/data-validation.js";
import { validateData as validateData2 } from "../src/data-validation.js";
const read = (n) => JSON.parse(fs.readFileSync(n, "utf8"));
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
export {
  validateData2 as validateData
};
