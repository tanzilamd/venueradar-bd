# UI refinement — 26 October 2026

This pass refined the existing English, Dhaka-first directory. It did not change the venue JSON, source evidence, URLs, hosting setup, or manager publishing rules.

## What changed

- **Discovery and cards:** warmer ivory surfaces, a restrained gold accent, clearer heading and guidance, a direct “More areas” route to the area picker, aligned 44px action targets, visible mobile detail cue, saved/selected states, and a compact phone label on very narrow screens. The nearby-neighborhood checkbox appears only after an area is chosen.
- **Map and inspector:** separated Call, Google Maps and Details actions in the selected-venue panel; harmonized marker clusters with the brand palette; made clusters keyboard activatable. The desktop inspector now starts with the venue name and contact actions and loads its optional location preview on request. Tile failure and missing-coordinate fallbacks remain available.
- **Details, comparison and Saved:** removed the duplicate primary call link from the expanded contact list while retaining number copying and secondary contacts; improved modal spacing and mobile comparison scrolling; made the empty Saved page a focused shortlist invitation. Feedback notifications dismiss after a short time and are cleared on tab changes, while Undo remains available for eight seconds.
- **Manager and accessibility:** matched the public palette, improved focus visibility and review controls on long forms. Icon-only actions have venue-specific accessible names and 44px targets. The reduced-motion preference is respected.

## Before and after

These are 1× viewport captures from Chromium. The “before” images were taken from the existing local site before editing; “after” images are from the production build. They intentionally show the same interface states, not fabricated venue content.

| State | Before | After |
| --- | --- | --- |
| Desktop directory, 1440px | [Before](ui-refinement/before-home-1440.jpg) | [After](ui-refinement/after-home-1440.jpg) |
| Mobile directory, 390px | [Before](ui-refinement/before-home-390.jpg) | [After](ui-refinement/after-home-390.jpg) |
| Selected map venue, 390px | [Before](ui-refinement/before-map-selected-390.jpg) | [After](ui-refinement/after-map-selected-390.jpg) |
| Comparison, 390px | [Before](ui-refinement/before-compare-390.jpg) | [After](ui-refinement/after-compare-390.jpg) |
| Empty Saved page, 390px | [Before](ui-refinement/before-saved-390.jpg) | [After](ui-refinement/after-saved-390.jpg) |
| Directory manager, 390px | [Before](ui-refinement/before-manager-390.jpg) | [After](ui-refinement/after-manager-390.jpg) |

## Verification and limits

- Checked real directory and manager screens at 320, 360, 390, 430, 768, 1024 and 1440 CSS pixels. Browser tests also cover 1363 and 1920px. The initial 320px horizontal overflow was 7px; it is now 0px at every checked width.
- `npm run validate`: 139 venue records validated. `npm test`: 29 passed. `npm run test:browser`: 45 passed, including keyboard behavior, accessible names, Axe scans, filters, Saved, comparison, map selection and responsive layouts. `npm run build`: passed.
- In this cloud browser, the OpenStreetMap tile host did not provide tiles, so the captured map screens show the working tile-failure message, markers, attribution and list/Google Maps fallback. This does not establish that tiles fail for other visitors. The Leaflet tile source and attribution are unchanged.
- A separate, source-backed data research pass would be needed to close remaining venue information gaps. This UI task did not alter any venue facts.
