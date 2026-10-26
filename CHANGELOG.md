# Changelog

## Map-first venue browsing — 26 October 2026
- Show the number of indexed venues inside the visible map, with an explicit action to browse just those venues and a one-tap reset to the full directory.
- Add one-time Near me positioning with a distinct approximate-location dot and straight-line distance sorting. Coordinates remain in memory only.
- Keep map-area results available on mobile only when requested, preserve the existing search and Saved/Compare behavior, and extend the Leaflet fallback and live browser checks.

## Clean Workspace interface — 26 October 2026
- Implement the selected compact list design, dark-green search/navigation and self-hosted Inter typography.
- Add a selected-hall contact panel with an on-demand real location map, and compact mobile detail sheets with additional options available on demand.
- Preserve area/nearby discovery, phone/map actions, Saved, Compare and the owner manager; make Near me usable directly from mobile filters.
- Preserve the complete venue dataset. Add workspace regression checks, safe text-only Leaflet labels and deployed-browser verification for the new layout and font.

## Additional Dhaka halls and consistent nearby areas — 26 October 2026
- Add six individually reviewed dedicated halls with sourced phones and map positions; preserve all 129 prior records and contacts. Active directory: 135 records, including 127 halls/centers and eight separately grouped hotels.
- Align Ananda and Jonaki under the broader Paltan browsing zone while preserving the Naya Paltan address. Connect nearby Naya Paltan/Motijheel both ways, make nearby relationships reciprocal, and keep shared-zone neighbors consistent.
- Preserve the nearby selection across shared links and reloads. Add unit, browser and live-deployment checks for area behavior.
- Recheck eight missing-contact follow-ups; document 33 still unresolved phones, identity/address conflicts and rejected operator website candidates without inventing facts. See `docs/reports/2026-10-26-additional-halls.md`.

## Contact-first UI and visual directory manager
- Simplify public cards, details, filters and comparison to name, area, address, phones and maps; retain historical research in JSON.
- Add graphical add/edit/remove, drafts, import/export, validation and optional owner-authenticated atomic GitHub publishing with previous-version archives and conflict protection.
- Auto-sync area indexes and collections so single-file data uploads do not require manual cross-file edits.
- Add Waterfront, LakeViewGrande, PolicePlaza and Elite; corroborate Jonaki, retain owner-supplied Fortune contact and confirmed Khilgaon position; archive seven permanently closed records.
- See the contact-directory report for current counts, unresolved phones and actual publication state.

## Final contact-review follow-up
- Attempt all remaining 34 follow-ups: 29 additional source-review outcomes and 5 explicitly source-limited investigations. Total sourced-phone coverage:94venues,118published contact entries,114distinct numbers.
- Preserve131original records and facts; label missing-contact research outcomes, source/date and identity/closure/address conflicts. Document58complete addresses,13capacity records and39facility-bearing records.
- Add owner-supplied Jonaki Convention Hall as an explicitly unverified submission; do not count its phone as source-verified or guess its neighborhood.
- Keep earlier publication checkpoints below as historical entries.

## UI usability and contact-completion revision
- Implement search-first layout, independent Saved state, curated search aliases, honest exact/nearby and capacity context, accessible draft/apply mobile filters, actionable comparison and lazy map workspace.
- Preserve all 131 venue IDs and established facts; enrich 93 records with additional citations or supported public facts. Increase sourced phone coverage from 59 to 86 venues, with 105 contact entries / 101 distinct numbers.
- Add 13 numeric/range capacity records, 21 facility-bearing records, source-backed hours/catering notes and explicit identity/closure conflicts.
- Record the unfinished research honestly: 95 source-review outcomes, 36 additional follow-ups blocked by source/network access. See the 26 October audit and unresolved list.

## Unreleased
- Add English-only, Dhaka-focused static discovery application.
- Add source-aware schema, validators, manual research guidance and safe update process.
- Add unit and browser validation and Pages workflow with empty-dataset deployment guard.
- Admit eight official-source Dhaka venues with eight public business phone numbers. Hotel-focused coverage is incomplete; no nationwide completeness claim.

## Dhaka independent hall expansion
- Add Police Convention Hall (Eskaton), RAOWA Convention Halls and SKS Convention Hall (Mohakhali), with sourced public business contacts. Preserve all 8 earlier venue records unchanged.
- Preserve published capacity ranges, including conservative size classification and visible layout caveats.
- Configure repository-local Tanzil Ahmed commit attribution; verify the associated GitHub account after pushing.
- Broader community-center coverage remains incomplete; source-access limitations are documented in the research change report.

## Manual bulk Dhaka halls batch
- Add 107 map-listed non-hotel venues from a checksum-verified Geofabrik/OSM extract; preserve all 11 earlier records unchanged.
- Default to 110 community/event/hall records, with the 8 existing hotels in a separate collection.
- Add evidence-level badges and source filters, mapped boundary validation, provenance snapshots, ODbL attribution and an explicit unknown-neighborhood filter.
- Keep map-only listings visibly unconfirmed for wedding booking and current operation; no capacities, phones or ratings are invented.

## Area-first contact revision
- Research 98 previously unassigned localities; preserve evidence and explicitly distinguish browsing areas from operator-confirmed addresses.
- Add 13 separately sourced halls/branches, including the user-linked Abacus, Ladies Club, Officers’ Club, Motijheel, Nanjing, BRCC, Siraj, AK and JK Malibagh; retain all earlier records.
- Increase phone-bearing records from 23 to 59, with 70 sourced published numbers; preserve prior valid contacts and show numbers on cards.
- Add priority-area shortcuts, transparent nearby-area browsing, phone quick filter and visible identity/closure review notices; remove THE RESEARCH DESK card.
- Preserve existing Git history as explicitly requested; continue repository-local Tanzil Ahmed commit attribution.

## Clean home links and share previews
- Use the native home link to clear search parameters and fragments without adding `#`.
- Add an original 1200×630 PNG/SVG brand card, absolute Open Graph image metadata and Twitter large-image card metadata. Preview crawlers can read all metadata without JavaScript.

## MapLibre map refresh
- Replace the default Leaflet basemap with a lazy-loaded MapLibre/OpenFreeMap Positron vector map; keep the existing Leaflet map as a fallback for devices without WebGL 2.
- Preserve map/list selection, fit results, coordinate gaps and contact actions. Add keyboard-accessible venue markers, clusters and a venue chooser for shared coordinates.
- Keep provider attribution visible, retain the list/Google Maps fallback when imagery fails, and verify real vector tiles in the Pages live-browser workflow. No venue records or paid services changed.
