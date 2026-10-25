# Codex-managed data updates

Request: “Research Dhaka venues in [neighborhood] for VenueRadar BD. Follow docs/RESEARCH_GUIDE.md and docs/DATA_UPDATE_GUIDE.md. Produce an evidence-backed change report before significant publication.”

## Mandatory safeguards

1. Begin from a clean Git branch; inspect existing records, curated decisions and conflicts. Preserve user edits.
2. Research through legitimate sources; obey licenses, attribution, robots and service restrictions. Never scrape Google Maps or run scheduled research.
3. Match stable IDs, aliases, district, coordinates and public phone numbers to detect duplicates before additions. IDs never depend on array position and remain stable after renaming.
4. Protect previously verified fields. Never overwrite them with lower-confidence information, empty strings or null. Preserve all source URLs and verification dates. Historical evidence belongs in Git and the change report.
5. If sources disagree, retain the established value and append a structured conflict with old/proposed values, URLs, dates and the reason in `data/curated.json`. Ask for review rather than choosing silently.
6. Never automatically delete venues. Mark potential closure as a conflict until verified; preserve records and propose any removal explicitly.
7. Run `npm run validate`, `npm test`, `npm run build`, and browser tests. Check source links manually; inspect coordinates against actual Bangladesh boundaries and address. Inspect representative mobile and desktop records.
8. Generate `docs/reports/YYYY-MM-DD.md` listing added IDs, modified fields (before/after), unchanged IDs/count, conflicts, missing information, validation failures and proposed deletions (including “none”). Report sourced phones and geographic coverage separately from completeness or quality.
9. Require user approval before publishing significant or destructive DATA changes. Initial project delivery is already authorized; future bulk replacement, removal or reinterpretation needs a concrete report and approval. Routine non-destructive corrections may follow the explicit scope of the current request.
10. Commit data, evidence and report together. Keep Git history for rollback; never force-push. Reverse a problematic release with `git revert <commit>` and rerun validation/deployment.

## Data paths

Source data lives in `public/data/` and is published as `/data/`. `venues.json` contains admitted records only. `curated.json` separates research decisions and conflicts. `sources.json` holds dataset-wide attribution. `areas.json` defines the Dhaka neighborhood explorer; `city` provides future city scoping. Nationwide administrative reference data is preserved separately in `docs/reference/` and is not published or exposed in navigation. Venue `area` is an evidenced local name, not an invented administrative label. There is no claim of a complete upazila catalogue. `schemas/venue.schema.json` documents every venue field.

Unknown optional fields use null or empty arrays, never fictional values. Protect existing valid values in updates. Facility evidence uses `facilities.Parking` etc. Phone evidence must refer to `phones` and match the number source URL. Every populated factual field must have supporting evidence; manually review aliases and area too.

## Published capacity ranges

When a source gives a range, preserve it in optional `capacity_range: {"min":400,"max":500}` with `capacity: null` and evidence for `capacity_range`. Never silently choose an endpoint as an exact capacity. Both endpoints must be positive integers and min must not exceed max. UI classification is available only if both endpoints belong to the same size band; capacity sorting uses the lower bound. Preserve the named hall and seating layout, or explicitly state that the layout is unspecified. Do not add multiple hall capacities together.
