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

## Explicit manual bulk discovery

Bulk research is allowed when explicitly requested; scheduled discovery remains forbidden. Prefer a single licensed extract and local filtering to repetitive venue-by-venue search. Verify the provider’s published checksum before processing. Keep large extracts and temporary tooling outside the repository. Do not expand research outside Dhaka while filtering the national extract.

A `community_centre` tag alone is not proof of a wedding venue. Review names/types, exclude clinics, toilets, shops, welfare hubs, schools, roads and ambiguous institutions. Use the attributed metropolitan boundary for spatial scoping and inspect duplicates, renamed businesses, point/building pairs and co-located halls. Hold identity conflicts; never double-count them to inflate coverage.

Map-only admissions require `verification: open-data-listed`, full discovery metadata, source URL, edit timestamp and explicit uncertainty. Never relabel a map listing as operator-verified. Preserve map edit dates separately from review dates. Unknown phone numbers, addresses, capacities and facilities remain unknown. Do not infer a neighborhood from the nearest map label or estimate a venue's capacity from its building geometry.

The combined database and extracted geometry are ODbL-1.0. Preserve visible attribution and the full license. Include only relevant public business tags in provenance snapshots; exclude private schedules, personal staff data, security details and unrelated building attributes. Retain IDs in collections.json and keep every active venue in exactly one group. The community-halls group is the default; hotels remain separately accessible, not deleted.

When operator evidence becomes available, preserve stronger existing fields and source history. Treat a conflicting first-party/map identity as a review item. Never overwrite a valid operator phone with an older or incomplete mapped number. Public map phone tags are published contacts, not call-tested lines. Report the number of new map listings separately from operator-confirmed records; do not claim full Dhaka coverage without a demonstrably complete inventory.
