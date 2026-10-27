# Restaurant and party-center collection and wedding-place research — 27 October 2026

The owner requested a separate restaurant/party-center collection and further Dhaka wedding-place discovery. This update separates mixed-use party businesses from dedicated halls, adds nine individually matched venues, and improves one existing party-house listing after detecting a duplicate. A party-center label describes the business type; it is **not** proof that weddings can currently be booked there. Among the new venues, Onion Leaf's first-party page explicitly advertises weddings. Other new party venues need direct booking confirmation. Dhaka-wide completeness cannot be established from the available sources.

## Change report

| Measure | Before | After |
| --- | ---: | ---: |
| Indexed Dhaka venues | 154 | 163 |
| Venues with sourced public business phones | 119 | 128 |
| Published phone entries | 158 | 168 |
| Distinct normalized phone numbers | 154 | 164 |
| Venues with map coordinates | 142 | 151 |
| Dedicated community centers and halls | 146 | 131 |
| Restaurants and party centers | 0 | 24 |
| Hotel venues | 8 | 8 |

**Added (9):** `bd-onion-leaf-restaurant-party-center` (Rampura), `bd-shanghai-chinese-party-center-jatrabari` (Jatrabari), `bd-arabian-khabsa-party-center-jigatola` (Jigatola), `bd-dhanmondi-party-center` (Dhanmondi), `bd-red-chilli-party-center-banasree` (Banasree), `bd-shaker-park-party-center-jatrabari` (Jatrabari), `bd-victoria-convention-center-dhanmondi` (Dhanmondi; dedicated hall), `bd-golden-sun-party-center-mirpur` (Mirpur), and `bd-sector-7-party-center-uttara` (Uttara). All nine have a source-qualified business phone and a named business map point. Onion Leaf has two published first-party numbers; the others have one each. No number was call-tested.

**Modified (16 existing records):** The 15 previously indexed mixed-use restaurant/party listings identified in `public/data/curated.json` gained `collection: restaurant-party-centers`. `bd-osm-node-4072852261` (Kader Party House) was also moved and gained a more specific, source-backed partial address, a matched business map URL and map point, additional evidence and a review note. Its stable ID, existing phone record, original evidence and OSM discovery history were preserved. A proposed new Kader's record was discarded when the identical phone and alias revealed it was already indexed.

**Unchanged existing venue records:** 138. **Proposed deletions:** none. **Validation failures:** none. Collection membership is generated from the optional `collection` field for explicitly classified records and retained for other records. The visual manager now allows the owner to select a collection when adding or editing.

## Evidence and decisions

- [Onion Leaf's first-party site](https://onionleafbd.com/) explicitly offers wedding events, gives 458 West Rampura, DIT Road and two public business numbers. Its individually matched Maps profile agrees on the address and first number. This is the strongest new wedding-use evidence. The operator page was accessible during research; a later retry and robots request hit environment HTTP 503, so no automated crawl or copied site text is included.
- Eight other new venues were individually inspected as named public business profiles; several were cross-checked against named objects in the checksum-verified Geofabrik/OpenStreetMap extract. Records retain exact URLs, review dates and field-level evidence. OSM data is © OpenStreetMap contributors under ODbL-1.0. Only identity, location and published contact facts were recorded from Maps; no ratings, reviews, photographs, operating hours or bulk Places data were stored.
- The new Mirpur Golden Sun profile is **not** treated as the older Golden Sun OSM object near Jatrabari; no branch relationship was established. Dhanmondi Party Center's listed site could not be inspected, and Sector 7's linked site returned HTTP 503. Neither inaccessible site is used as official evidence.
- Shanghai's older OSM phone `+8801924748437` conflicts with the individually inspected business-profile number `+8801943317335`. Only the latter is displayed; whether either line is currently active is unresolved. Kader's older OSM building number `352` remains a **partial** address until operator confirmation.

## Held candidates and remaining gaps

Golden Gate may duplicate Blue Moon at the same Khilgaon road segment. Rainbow Bridge and SAQI lacked a uniquely matched current business identity in targeted review. Rodevu and Casanova matched listings previously marked permanently closed. Cafe Party Center and Yan Xin were not admitted from an ambiguous or inaccessible targeted search. These are candidates for future manual research, not hidden directory records. Some operator pages and new Maps requests became inaccessible after the environment began returning HTTP 503. That prevented a complete Dhaka sweep; existing data and prior evidence were not replaced with guesses.

Wedding-specific booking terms remain unconfirmed for eight of the nine added venues and for most older party centers. Venue suitability, present operation, exact entrance and phone activity should be confirmed directly. The collection is a type-based discovery aid, not a claim that every business hosts weddings today. The original [research guide](../RESEARCH_GUIDE.md) and [update guide](../DATA_UPDATE_GUIDE.md) govern follow-up research.

Validation before publication: `npm run validate` passed for all 163 records; 30 unit tests and 50 browser tests passed. The production build completed. The browser suite covered the new collection URL, filtering, mobile layouts, map fallback, saved/compare behavior and manager workflow.
