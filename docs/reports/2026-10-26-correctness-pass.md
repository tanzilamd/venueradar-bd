# VenueRadar BD correctness and data pass — 26 October 2026

The existing English, Dhaka-only forest-green interface and layout were preserved. This revision makes targeted data and behavior corrections. All source observations below were made on individual public pages; no Google ratings, reviews, photos, opening hours or restricted Places API responses were copied.

## Data coverage

| Measure | Before | After |
|---|---:|---:|
| Active records | 139 | 139 |
| Records with sourced phones | 107 | 107 |
| Published phone entries / distinct values | 134 / 130 | 135 / 131 |
| Records with stored coordinates | 127 | 127 |
| Records with source-published addresses | 55 | 55 |
| Records carrying review notices | 22 | 25 |

The additional number is +8801616555560 on the individually inspected [Popeyes business listing](https://www.google.com/maps/place/Popeyes+Convention+Hall/@23.8356278,90.3760218,17z/data=!3m1!4b1!4m6!3m5!1s0x3755c134d1aac785:0x1c197773a8967e7!8m2!3d23.8356278!4d90.3760218!16s%2Fg%2F11c6cdqz7p). Its older booking-page number was preserved. Neither line was call-tested.

## Maps-link and identity audit

Every active record's stored Maps URL or generated fallback was structurally checked in [the per-ID audit ledger](../research/2026-10-26-map-link-audit.json): 32 direct place links, 66 named searches, two coordinate searches, one short link and 38 generated name/address searches. Direct place URLs with stored coordinates were checked against their point; none differed by more than 200 m. Search links are navigation queries, not proof of an exact matched business. Seven listing pages were individually viewed, plus the Abacus short-link redirect; other 131 business destinations remain unverified individually.

- **Malibagh Community Centre:** the old URL searched for *Khilgaon Community Center*. It now searches the record's existing OSM coordinates. The different current business name and address remain a documented identity conflict; no Khilgaon phone, address or status was transferred to Malibagh.
- **Dream World Convention Center:** the matched Jigatola Maps listing reports **permanently closed**, while its third-party booking page still offers the hall and publishes different historic contacts. A visible closure warning now precedes its details. Its old phone evidence remains for audit; current operation and line ownership are not confirmed.
- **Mardi Gras Convention Hall:** the matched Shewrapara listing reports **permanently closed**. Its listing name and phone match the booking page. The exact Maps link and visible warning were added.
- **Popeyes Plus Convention Hall:** the matched Shagufta Road listing uses the shorter name *Popeyes Convention Hall*, reports **temporarily closed** and publishes a second number. The alternate name, exact Maps link, number and warning were added.
- **Nur Community Center:** the Bibir Bagicha listing names the co-located Thai Park restaurant and matches the venue-specific booking phone. An alias and exact Maps link were added without inventing an OSM marker.
- **Police Plaza Convention Centre** and **Motijheel Community Center:** exact public listings still display no venue phone. Unrelated shopping-mall, restaurant or municipal contacts were not borrowed.

The two reported permanently closed records remain in the repository and are visibly marked. Archive/removal is proposed for separate operator or independent confirmation; this pass performs **no deletions**. All previously sourced fields and historic citations remain available. Other source conflicts and the 32 phone gaps are listed in the preceding [contact report](2026-10-26-more-halls-and-contacts.md). Four phone-number values occur on two venues each; prior evidence suggests shared operators or municipal lines, so none was deleted without proof of misattribution.

## Functional corrections

- Map view now distinguishes **zero matching venues** from **matching venues without a sourced marker**. Tile errors no longer replace those more relevant messages, and the status resets when results change.
- Selecting a map marker on a narrow screen scrolls its contact actions above the existing Compare tray. The existing styling and tray placement are unchanged.
- Comparison shows published capacity and documented facilities only when at least one selected record has sourced data; unknown values remain explicit.
- The visual manager's existing search box accepts `missing:phone`, `missing:address`, `missing:map`, `missing:area` and `needs:review`, optionally followed by a name or area. This improves review without changing the editor's data model or security. GitHub tokens remain in memory only.
- The live-verification script accepts an optional proxy and a pin for the environment's public proxy CA. Production browsing and CI do not require these settings.

## Remaining limits

Thirty-two records still have no safely matched business phone; 12 lack an independently licensed exact coordinate; 84 lack a source-published full address. A missing field is not evidence that a venue lacks the feature. The two permanent and one temporary closure notices reflect public listing reports, not an operator declaration. A Maps place link can change after review. Google-origin coordinates were **not** copied into the OSM-powered directory; new exact links provide navigation where independently reusable coordinates remain unavailable. No new venue imagery or rating data was published.

Validation and deployment results are recorded after verification below.

## Local verification

- Schema, evidence, phone-format, duplicate and Dhaka-boundary validation: **139 records passed**.
- Unit/data tests: **29 passed**. Browser tests: **41 passed**, including map/list and Saved synchronization, compare persistence, mobile Compare-tray clearance, zero-result wording, manager queues, accessibility scans and responsive widths **360, 390, 768, 1363 and 1920 CSS pixels**. No skipped tests.
- Production Vite build passed. The existing Leaflet map remains lazy-loaded. Directly opened live pages before this deployment had working map markers and loaded tiles, no browser JavaScript errors, no horizontal overflow at the checked widths, and working Saved/Compare/manager controls. The new code still requires post-deploy verification below.
- No Lighthouse score was measured for this revision; earlier scores are not reused as a claim about this build.

Publication: pending the GitHub Pages workflow and live verification at the time this report was prepared.
