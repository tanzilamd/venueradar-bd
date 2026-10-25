# UI audit implementation and venue-data completion pass

Report date: 26 October 2026 (Asia/Dhaka). Source-review dates are stored in UTC; this session's source material was checked on 25 October UTC.
Baseline: `f6ee35295b21857d27119544c903c6cfdd18d957`. Scope: all 131 existing Dhaka records, plus one explicitly pending owner submission; no deletions, hotel expansion or history rewrite.

All 131 pre-existing records received an individual missing-field and source review. The final 34 follow-ups were attempted: 29 reached additional documented source-review outcomes and 5 remain limited by inaccessible sources. Overall, 126 existing records have source-review outcomes with genuine gaps and 5 have explicitly source-limited follow-up. **This is not 100% data completeness or a claim that every possible source was accessible.** Network recovery permitted substantial additional individual Maps and operator research, then the environment proxy again returned HTTP503 `cloudflare_https_tunnel / Invalid argument`, including GitHub. No robots exclusion, challenge or certificate verification was bypassed.

The owner also supplied **Jonaki Convention Hall**, phone01762884405 and PlusCodePCP7+HXH with a Maps link. It is displayed separately by status as **user-submitted / independent verification pending**, with an explicit card notice and unverified contact label. It is included in the 132 record count but excluded from the 94 sourced-phone record count and 118 published contact entries. Its decoded approximate point is not a surveyed entrance; the neighborhood remains unknown rather than guessed. There are no deletions or history rewrites.

## Before and after

| Metric | Before | Revision |
|---|---:|---:|
| Records (includes one explicit pending submission in revision) | 131 | 132 |
| Venues with sourced published business phones | 59 | 94 |
| Published phone entries across venue records | 70 | 118 |
| Distinct sourced public business numbers | 69 | 114 |
| Complete premises addresses | 26 | 58 |
| Mapped records with published source provenance (excludes submitted point) | 123 | 123 |
| Numeric capacity / bounded ranges | 8 | 13 |
| Records with documented facilities | 9 | 39 |
| Operator websites | 25 | 33 |
| Published first-party hours | 0 | 7 |


Coverage now comprises 131 preserved sourced records plus 1 pending submission: 124 community/event/hall records shown first and 8 preserved hotels separately. Shared numbers count once per venue contact entry but once overall in the distinct-number total. Published contacts retain source/date and are not call-tested. Contributor-supplied contact status is separate; WhatsApp support is not inferred.

A complete address requires a sourced premises/building plus road/locality, including 11 original operator addresses predating address_status. Road-only, city-only and PlusCode-only addresses do not count. All original 123 mapped points are preserved; the additional submitted point is separately qualified. Numeric capacities exclude ambiguous combined-floor and unbounded claims. Documented amenities do not mean all services or booking eligibility have been confirmed.

## Concrete data changes

- 35 additional existing records gained a sourced public business phone; 48 published contact entries were added (45 additional distinct numbers). Earlier phone objects and source/date history were preserved. The final follow-up added Dhalpur, Niketon, Samarai, Sagorika, Gandaria, Rifa, Baridhara DOHS and Azimpur public contacts, plus additional Party House, Banani DOHS, Shagoon, Talukdar and White Palace numbers.
- Public operator follow-up added Uttara Community Center's booking line, Intraco's second contact, Prianka Dhanmondi's three contacts, Paragon's second line, Siraj's additional line and Westin's published landline. Individual named business profiles supplied community-center contacts including Sutrapur, Rayer Bazar, Sumon, Ujala, Meem, Bilash Bhaban, Dania, Haji Rahman, Rongdhonu, Dholaipar, Fazlul Karim, Chishty, The Latest Boogie Woogie, Sahal, Waterfall Dhanmondi, Marriott Convention Center, Haji Jummon, New Dhanmondi, Sonali Nupur and Fakir Chan.
- New numeric capacity evidence: KIB Convention Hall 1 (450, layout unspecified); Aloki Grand Ball Room (400 round-table guests in one serving); Prianka Dhanmondi (600–700, layout unspecified); Paragon's 11th-floor hall (600, layout unspecified); Senamalancha's first-floor convention hall (1,200 maximum, layout unspecified). Halls, floors, serving rounds and seating layouts were not added together.
- Uttara and PSC publish aggregate or “+” claims without sufficiently precise single-hall seating layouts. These appear as qualified capacity notes and do not populate numeric size filters.
- Added explicitly documented facilities, first-party office/business hours and Senamalancha's approved-provider catering policy. Restaurant meal periods and Google hours were not reused as booking-office hours.
- Siraj's operator address (Plot 39, Block C) conflicts with its established listing address (Plots 44–46). Existing address/coordinates are retained with a review notice and structured conflict.
- Identity/category conflicts and reported closures are visibly flagged and retained. Invalid ATN phone `+88018-774550` was rejected as incomplete. Bare Ladies Club subscriber numbers were not assigned a guessed area code. RUAP mall and Rupsha hotel contacts were not presented as authenticated hall-booking lines.

No prior venue, phone object, evidence item, supported facility, numeric capacity or coordinate was removed. The preservation check caught a draft KIB facility-array replacement; the original Parking and Accessible entrance values were restored before integration. There are no proposed deletions.

## UI/UX audit implementation

| Audit item | Implemented behavior |
|---|---|
| F01, F10 | Compact search-first layout, quiet dataset summary, legible cards and primary contact actions. At 1363×936, the first complete card ends around 746px. |
| F02 | Exact-area and adjacent-area counts are separate; Rampura's zero indexed count is explicit. Nearby recovery preserves the selected area and actual venue labels. |
| F03 | Capacity coverage context, unknown-capacity alternatives, transparent thresholds and preserved ranges/layouts. |
| F04 | Saved has independent filters and all collections; Explore state is retained. Remove supports Undo and persistence failures remain usable in memory. |
| F05 | Curated locality aliases support English, Roman and Bengali search input, while the interface remains English. Short AK no longer matches Dhaka. |
| F06 | Loading skeleton/aria-busy, no transient zero venue counts, genuine error/retry state. |
| F07 | Review notices are visually distinct, sorted after unflagged records and filterable. No “confirmed open” assertion. |
| F08 | Call/Maps/Save/link actions first, full contacts and qualified facts, collapsed evidence with human source labels and correction links. |
| F09 | Lazy-loaded clustered map workspace, selected-marker/card synchronization, Fit results, mobile selected-venue panel and list fallback on tile failure. |
| F11 | Shareable query/detail/shortlist URLs and Back/Forward restoration. Precise user coordinates are never serialized or stored. |
| F12 | Real prefilled GitHub issue links carry venue ID and context; no nonfunctional submission form. GitHub may require login only for issue submission. |
| F13 | Callable comparison contacts, per-column removal, max-three tray with names and select-one-more guidance. |
| F14 | Simplified primary filters, optional advanced facilities/capacity/evidence controls and removable active chips. Mobile filters use draft → Apply; Cancel/Escape discards changes. |

English branding, Dhaka-only scope, static JSON, local favorites/comparison, one-time geolocation and zero mandatory operating cost are preserved. No root-site files, Pages domain settings or CNAME are changed.

## Validation and deployment

Final integrated checks and actual publication outcomes are recorded in `2026-10-26-qa.md`. A successful local build is not a live-deployment claim.

## Research evidence and unresolved work

- [All-record review ledger](../research/2026-10-26-venue-review.json): checked sources, field outcomes, conflicts, source access failures and unfinished follow-ups.
- [Field changes](../research/2026-10-26-field-changes.json): before/after values and added evidence counts for each modified record.
- [Unresolved information by venue](2026-10-26-unresolved-data.md): missing fields and research outcome for every record.
- Operator sites, licensed OSM/Geofabrik business tags and individually inspected public business profiles are the evidence sources. Some earlier same-day source captures were explicitly re-examined; they are labelled as cached captures, not fresh fetches.
- Facebook robots exclusions, Google/DDG search challenges, unavailable operator domains and the environment proxy incident limit follow-up. No prohibited bulk Maps extraction, hidden APIs, stored Google ratings/review counts/reviews/photos, copyrighted venue imagery or private schedules were used.

Future request: “Continue the blocked all-venue follow-ups in docs/research/2026-10-26-venue-review.json, prioritizing missing phones in Khilgaon, Malibagh, Motijheel, Eskaton and surrounding areas. Follow AGENTS.md and the research/update guides; preserve verified fields and report conflicts.” The 5 source-limited follow-ups and the Jonaki submission require accessible operator/business sources before claiming full independent completion.

### Location-match correction

A subsequent cross-record coordinate check found that the common Khilgaon/Malika Maps result matches the separate Malibagh record371381396, not the historic Khilgaon point263618386 about1.2km away. The earlier address/alias/exact-listing attachment was incorrect and has been retracted. Original Khilgaon source values and both IDs/points are preserved, with an explicit location-review notice. No phone was copied between these records.

## Final follow-up outcomes and visible missing-contact states

All 37 records without a sourced phone now carry dated phone-review metadata. Cards distinguish “Phone not found in checked sources”, “Phone research limited” and “Booking contact unconfirmed”; details explain why and explicitly avoid implying the venue has no telephone. Closure notices were added for matching Aangan and Talukdar profiles (reported permanent closure) and Moulovi Bazar (reported temporary closure). Historic records and contacts remain available. Azimpur's category mismatch, Ashkona's different current identity, Gandaria's premises-number conflict and Malibagh/Khilgaon naming/address conflict remain visible.

Source-limited follow-ups: Rayer Bazar, Nababgonj Sat Shahid, ICCB, RUAP and Somrat. Earlier inspected facts are retained; additional inaccessible pages are not reported as checked. Somrat's English/Bengali searches produced no exact usable business match, and secondary web search produced no readable results. No unrelated venue's phone was borrowed. The required unresolved list documents every venue individually.
