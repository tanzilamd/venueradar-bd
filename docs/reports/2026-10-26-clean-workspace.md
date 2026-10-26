# Clean Workspace interface

26 October 2026. Baseline: `42b116e`. Implements the owner's selected Clean Workspace reference using the existing static application and genuine directory data.

## Experience

- Dark forest-green navigation, a compact desktop search/area bar, restrained white surfaces and self-hosted Inter typography.
- Desktop rows align venue name/address, area and contact actions. Clicking a hall name or row selects it in a sticky contact panel; the chevron opens additional details. All existing Save, Compare, phone and map actions remain available independently.
- The panel offers every published contact, Google Maps, Save and Compare. Its location map loads on selection or explicit map interaction, uses the existing sourced coordinates, and reuses one Leaflet instance. No venue photographs or invented map imagery are required.
- Mobile uses readable stacked rows with area badges and prominent phone/map actions. Tapping a venue opens a compact, keyboard-accessible bottom sheet. Additional numbers, copy actions, website and correction link remain under More contacts & options.
- Area groups, reciprocal nearby areas, reload/share state, saved lists, comparison, clustered map and the graphical directory manager are preserved.
- Near me now works directly from the mobile filter sheet: apply the draft, close the sheet and request one-time geolocation. It does not store precise coordinates.

Unknown contacts, owner-supplied numbers and unresolved venue notices retain their existing meanings. No research status was upgraded and no venue fact was modified for this UI release. All 135 active records, area definitions and collection memberships are byte-for-byte identical to the baseline.

## Implementation and maintenance

The public theme is scoped to `.directory-page` in `src/workspace.css`; the owner manager retains the shared base styling. Search controls are moved between desktop/mobile docks without duplicating input IDs or filter state. Existing static subpaths and clean home navigation remain supported.

The Latin variable Inter font is self-hosted at `public/fonts/inter-latin.woff2` (48,256 bytes). Copyright The Inter Project Authors, SIL Open Font License 1.1; full license is included in `public/fonts/OFL-Inter.txt`. Source: Google Fonts Inter v20, fetched from `fonts.gstatic.com`; there is no runtime request to a font service. The font is preloaded using a project-relative URL.

Both map types bind venue labels as text nodes, so source names cannot introduce HTML into Leaflet tooltips. No new backend, accounts, paid API or operating service was introduced.

## Validation

Data/schema validation, the production build, 27 model/editor/data tests and 36 browser tests pass. Browser coverage includes the existing discovery, map, favorites, comparison, editor, accessibility and responsive tests, plus workspace selection, lazy preview map/failure fallback, escaped map labels, retained keyboard focus, mobile bottom sheets and mobile Near me.

Visual inspection covers narrow phones, tablet, laptop and wide desktop, including the selected Jonaki/Paltan state and real map tiles. Production-preview checks run under `/venueradar-bd/`, including relative font/assets and the owner manager. No current Lighthouse score is claimed.

The Pages verification script additionally checks the actual deployed workspace panel, selected location map, mobile detail sheet and self-hosted font, and saves screenshots with its report. The corresponding Actions run and report determine live publication success; a local preview is not a live-deployment claim.
