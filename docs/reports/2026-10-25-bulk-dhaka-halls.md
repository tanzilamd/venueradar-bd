# Manual bulk Dhaka hall discovery — 25 October 2026

## Result

Added **107 non-hotel map-listed venues** in one controlled batch. The directory now contains **118 records**: **110 community/event/convention/banquet hall records** in the default collection and **8 preserved hotel venues** in a separate collection. All **11 previously admitted venue objects are unchanged**. No hotel was added. No record was deleted.

New records by category: 60 Community Center, 32 Convention Center, 13 Event Hall, 2 Banquet Hall. These are mapped venue categories, not claims that every location is exclusively for weddings.

New phone-bearing records: **12**, all from explicit public venue contact tags. Directory totals: **23 records with sourced business numbers**, **26 published phone numbers**, **111 map positions**, and **8 records with documented capacity (including one range)**. The 107 new records have no invented capacity, facilities or numerical ratings. Ninety-eight directory records lack a confirmed neighborhood assignment; they remain searchable and mapped, with an explicit unknown-area filter. Neighborhoods are taken only from supplied address text, not guessed from nearest points.

## Acquisition and source integrity

- Source: https://download.geofabrik.de/asia/bangladesh-latest.osm.pbf
- Extract replication timestamp: **2026-10-24T20:20:51Z**.
- Published MD5 matched: **26255e4193d1fe1222e5c4ddd605da16**.
- The source SHA-256 is recorded in `public/data/discovery.json`.
- Tool: PyOsmium 4.3.2 in a temporary research environment; no new application dependency.
- One country extract was downloaded to temporary storage, processed locally, and **not committed**. Research was restricted to the Dhaka metropolitan area. No map tiles, Google Places records, ratings, photos or reviews were bulk-collected.

A broad name/type discovery pass returned **418 candidate elements** in the Dhaka-adjacent bounding area. Manual review excluded hospitals, clinics, public toilets, shops, wedding planners, roads, welfare hubs, generic clubs, university lecture halls, ambiguous facilities and other irrelevant matches. A `community_centre` tag alone was not treated as proof of wedding use. The retained collection focuses on named community centers, party centers, convention halls and explicit event venues; wedding-only use remains unconfirmed for map-only records.

Each retained point is inside the mapped Dhaka Metropolitan polygon, OpenStreetMap relation **13663697**. Eight manually shortlisted outside-scope candidates were held. This OSM boundary is a spatial research scope, not an independently surveyed or legally authoritative city boundary.

## Duplicate and conflict handling

Ten point/building or spelling-variant groups were resolved into one venue identity, with the other source URLs retained as aliases/evidence. The already operator-sourced RAOWA record was preserved and its mapped complex was not re-added. Police Convention Hall in Eskaton was not confused with the separately mapped PSC Convention Hall in Mirpur.

Two Rupali Community Centre candidates have the same name at nearby locations. Branch versus relocation identity is not established, so both new candidates were held for review rather than guessed or double-counted. Other ambiguous venue/campus identities are also retained in the curated review queue, not published as new venues.

Two Priyanka contact strings lack an unambiguous Dhaka area code; they were not repaired by inventing digits. A nearby PSC/Police duplicate links to an inconsistent location; its phone was not borrowed. No existing verified field was overwritten with map data, null or lower-confidence information.

## Evidence level and limitations

The 107 new records use `verification: open-data-listed`. The UI says **“Map listing · confirm wedding booking”**, exposes the map edit date separately from the source-review date, and explains that current operation and wedding booking need confirmation. The 11 earlier operator-source records retain their original evidence status. Map listings are never labelled operator-verified.

Mapped point locations are published map points. Building markers are approximate bounding-box centers, not verified entrances. The geometry method and OSM element type, ID, version and edit timestamp are preserved per record. Unpublished street addresses, phone numbers, seating capacities and facilities remain unknown.

**This is not proof of all venues in Dhaka, active operation, or wedding-only use.** The batch substantially expands independent hall discovery without fabricated records. Further explicit research should enrich public contacts and operator-confirmed wedding information, not replace source evidence with assumptions. Optional operator-site domain additions were saved for later review; blocked operator pages were not used to invent facts or delay this accessible open-data batch.

## Data and application changes

- `venues.json`: 107 added IDs, listed in `curated.json` → `bulk_2026_10_25.added_ids`; 11 existing records unchanged.
- `discovery.json`: source metadata, checksums, filtered provenance snapshots and edit dates.
- `dhaka-boundary.geojson`: attributed OSM metropolitan scope used by validation.
- `collections.json`: explicit hall-first and hotel groups. All 118 records belong to exactly one group.
- Schema/validator: mapped evidence tier, source identity checks, boundary checks and complete collection membership.
- UI: hall-first default, source-type filter, unknown-area filter and clear evidence badges. Existing saved hotels remain accessible through Saved; old favorites and comparisons are not erased.
- Static fallback: use actual evidence links when no official website is verified; never emit `href="null"`.
- Phone/capacity/date checks and probable duplicate detection remain enabled.

Database and derived boundary: **ODbL-1.0**, © OpenStreetMap contributors, with separately cited operator facts. Application code remains MIT. Full data-license text and visible attribution are included. No scheduled research/scraping workflow was added.

## Validation

Schema, source identity, geographical scope, duplicate checks and collection membership: **118 records pass**. Tests: **11 unit tests and 12 browser scenarios pass**, including source filters, hall-first behavior, map-source uncertainty, missing-address search links and preservation of saved hotel access. Production build and local production smoke test pass. Responsive screens were inspected at 360, 768, 1366 and 1920 pixels; the mapped-source card and details were separately inspected on mobile.

Conflicts: held and recorded as above. Missing information: explicit in each record and summarized above. Validation failures remaining: none. Proposed deletions: none. Added records are not represented as a complete or fully operator-verified Dhaka inventory. Live deployment and author attribution must be verified after the push.
