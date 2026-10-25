# UI audit implementation and venue-data completion pass

Report date: 26 October 2026 (Asia/Dhaka). Source-review dates are stored in UTC; this session's source material was checked on 25 October UTC.
Baseline: `f6ee35295b21857d27119544c903c6cfdd18d957`. Scope: all 131 existing Dhaka records; no additions, deletions, hotel expansion or history rewrite.

**Research is not complete.** All 131 records received a missing-field inventory. 95 records reached documented source-review outcomes (often with genuine unknowns); 36 require additional follow-up. The latter are explicitly labelled `blocked-follow-up`, not counted as completed multi-source investigations. Reapplying the environment network settings did not restore the public-internet route: new Maps/operator requests repeatedly return HTTP 503 `cloudflare_https_tunnel / Invalid argument`. GitHub and the existing Pages URL sometimes respond through other platform routes. This is not evidence of a closed business or missing credentials. No denial, CAPTCHA, robots exclusion or TLS verification was bypassed.

The verified non-destructive enrichments are integrated so they can be tested and reviewed. This report does not satisfy or claim the owner's acceptance criterion that every missing field has completed investigation. The machine-readable review ledger and unresolved list identify exactly what remains.

## Before and after

| Metric | Before | Researched revision |
|---|---:|---:|
| Venue records | 131 | 131 |
| Venues with sourced phones | 59 | 86 |
| Sourced phone entries across venue records | 70 | 105 |
| Distinct public business numbers | 69 | 101 |
| Published complete premises addresses | 26 | 56 |
| Mapped coordinate records | 123 | 123 |
| Numeric capacity / bounded ranges | 8 | 13 |
| Records with documented facilities | 9 | 21 |
| Operator websites | 25 | 30 |
| Published first-party hours | 0 | 6 |

Counts cover all 131 records, including the 8 preserved hotels; the default hall collection contains 123 records. Phone entries count a published contact once per venue; shared operator/municipal contacts are not independent unique lines. Every phone retains source, UTC review date and `published-not-call-tested` status. No phone was called. No WhatsApp support is inferred.

A complete address means a sourced premises/building plus road/locality, including the 11 original operator addresses whose legacy records predate `address_status`. Road-only, city-only and Plus Code-only addresses are excluded. Coordinates are existing published positions, not independently surveyed entrances. Numeric capacity excludes unbounded/ambiguous combined-floor claims; those remain qualified notes. Facility coverage means at least one supported amenity, not that all amenities or booking eligibility are known.

## Concrete data changes

- 27 additional records gained a public business phone; 35 sourced phone entries were added (32 distinct numbers). Earlier phone objects and source/date history were preserved.
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

The initial revised interface passed 12 model/data tests and 20 browser regressions, including five responsive widths and axe scans. Final integrated-dataset checks and measured production results are recorded in `2026-10-26-qa.md`; do not infer publication or live verification from a successful local build.

## Research evidence and unresolved work

- [All-record review ledger](../research/2026-10-26-venue-review.json): checked sources, field outcomes, conflicts, source access failures and unfinished follow-ups.
- [Field changes](../research/2026-10-26-field-changes.json): before/after values and added evidence counts for each modified record.
- [Unresolved information by venue](2026-10-26-unresolved-data.md): missing fields and research outcome for every record.
- Operator sites, licensed OSM/Geofabrik business tags and individually inspected public business profiles are the evidence sources. Some earlier same-day source captures were explicitly re-examined; they are labelled as cached captures, not fresh fetches.
- Facebook robots exclusions, Google/DDG search challenges, unavailable operator domains and the environment proxy incident limit follow-up. No prohibited bulk Maps extraction, hidden APIs, stored Google ratings/review counts/reviews/photos, copyrighted venue imagery or private schedules were used.

Future request: “Continue the blocked all-venue follow-ups in docs/research/2026-10-26-venue-review.json, prioritizing missing phones in Khilgaon, Malibagh, Motijheel, Eskaton and surrounding areas. Follow AGENTS.md and the research/update guides; preserve verified fields and report conflicts.” Network restoration is required before calling this research phase complete.
