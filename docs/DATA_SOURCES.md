# Data sources and present coverage

## Current directory

132 entries in Dhaka: **124 hall/community/event records shown by default (including one visibly pending owner submission)**, and **8 existing hotels separately**. 110 primary map listings retain explicit operator-confirmation warnings. Individually checked business listings and additional operator contact sources are distinguished in each record. No completeness, current-operation or wedding-only guarantee is made.

**94 records have sourced published business contacts (118 entries; 114 distinct numbers)**; 37 existing records lack a sourced phone. One additional owner submission has an explicitly unverified contact. No line has been call-tested. 13 records have numeric capacity or bounded ranges, including a range; 123 have mapped positions. All records have a reviewed browsing locality, covering 61 labels. The 98 previously blank areas were researched through cached address hierarchies and reviewed named-address context. This is not independent operator confirmation of every area or a legal boundary survey. Five priority shortcuts include explicit nearby areas, preserving each venue’s actual locality.

The latest [UI/data audit](reports/2026-10-26-ui-data-audit.md) records 126 source-review outcomes, 5 source-limited follow-ups and one pending owner submission; it does not claim that comprehensive all-venue research is complete.

The earlier correction report is [area and contact revision](reports/2026-10-25-area-contact-revision.md). It details added and modified records, contacts, conflicts, rejected sources and remaining gaps. Closures and ambiguous identities are flagged visibly; no existing venue was automatically removed.

## Bulk map source

OpenStreetMap contributors via the Geofabrik Bangladesh extract:

- https://download.geofabrik.de/asia/bangladesh.html
- https://www.openstreetmap.org/copyright
- Dhaka Metropolitan scope: https://www.openstreetmap.org/relation/13663697

The 24 October 2026 extract was acquired and checksum-verified during this explicitly requested manual research session. Each new listing retains its OSM identity, version, edit date and geometry method. `public/data/discovery.json` stores the extract metadata, checksums and relevant source tags. `public/data/curated.json` stores admissions, duplicate decisions, conflicts and held candidates. The raw country extract stays outside the repository.

A map edit date is not a business operating-status check. The source-review date means the map data was inspected. Map-only records have an explicit lower-evidence status. No numerical Google ratings, review counts, reviews, unlicensed photographs, opening hours or copied promotional text are included. The owner-requested contact revision used individual manual business-listing checks for public facts, without a Places API, automated contact extraction or bulk Places export.

The venue database and derived boundary are distributed under ODbL-1.0, with attribution to OpenStreetMap contributors and separate operator citations. The full text is in `public/licenses/ODbL-1.0.txt`; data licensing is distinguished from MIT application code.

## Operator sources

The original 11 records retain their original first-party source URLs, public business contacts, capacities and uncertainty notes; the previously unassigned Sonargaon area was researched separately. Additional first-party contact pages include Dhaka Ladies Club, KIB, Army Welfare Trust public hall-booking contacts, Zaara, JK, X-Group and BCFCC. These include official event pages for the eight hotels, Police Convention Hall, RAOWA and SKS. No lower-confidence map field has overwritten an existing operator-sourced value. See `venues.json` for field-specific citations and the earlier change reports for their admission decisions.

## Administrative reference

`docs/reference/bangladesh-areas.json` was originally derived from https://github.com/nuhil/bangladesh-geocode under MIT (copyright 2014 Nuhil Mehdy; full notice in GEOCODE_LICENSE.txt). This is a development reference, not a nationwide directory or Version 1 navigation. Neighborhood labels use reviewed address hierarchies, source names/roads and branch-specific address checks. A nearest geocoder result is not automatically accepted. `public/data/area-reviews.json` preserves the original hierarchy and the reviewed grouping; broader locality suggestions can be refined when a named address supports it. No runtime geocoder or location tracking was added.

## Map display

Leaflet and marker clustering are bundled locally. Standard OSM tiles load only when users open the map, with visible attribution. No bulk tile download, prefetch or offline tile cache is implemented. See https://operations.osmfoundation.org/policies/tiles/ . All information remains accessible in the list if tiles fail.

## Research reports

- [Initial dataset](reports/2026-10-25.md)
- [First independent halls](reports/2026-10-25-community-halls.md)
- [Bulk Dhaka hall discovery](reports/2026-10-25-bulk-dhaka-halls.md)

Historical reports preserve their original counts. This document describes the current dataset. Future research must follow DATA_UPDATE_GUIDE.md and protect previously verified records.
