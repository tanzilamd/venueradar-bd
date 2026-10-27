# Full-screen map and missing-marker review — 27 October 2026

The directory has **173** indexed venues. Before this pass, **161** had source-backed map points; after it, **168** do. Seven established records gained markers. No venues, phones, addresses or collection memberships were added, removed or replaced. The other **166** venue coordinates are unchanged. No proposed deletions or source-field conflicts were resolved by guessing.

The new map control fills the viewport without relying on browser Fullscreen API support. It keeps the current map, markers, selection, Fit results, Near me, map-area browsing, source attribution and list fallback. The exit button and Escape close it; keyboard focus returns to the directory. The layout allows the selected venue’s Call and Maps actions to remain visible and scrollable on small screens. A first-load sizing correction keeps map points in view when the selected-venue panel changes the map height. Map fit gives the zoom controls additional clearance.

## Marker additions

Each point comes from a matching **named OpenStreetMap building or complex**, which is © OpenStreetMap contributors under ODbL-1.0. The first six were checked in the previously checksum-verified 25 October Geofabrik Bangladesh extract; the Police Convention Hall relation was checked through the current OpenStreetMap API. These are **approximate building centres, not surveyed entrances or operator-provided pin locations**. The original official-business address and prior evidence remain intact. Individual OSM element URLs, edit dates and this review date are stored on each record.

| Existing venue | OSM match | Reason the match is specific |
| --- | --- | --- |
| Radisson Blu Water Garden Hotel, Dhaka | [way 240041045](https://www.openstreetmap.org/way/240041045) | Matching full hotel name and building geometry in Dhaka Cantonment |
| Pan Pacific Sonargaon Dhaka | [way 32562242](https://www.openstreetmap.org/way/32562242) | Matching hotel name, Kazi Nazrul Islam Avenue and operator website |
| Amari Dhaka | [way 366172605](https://www.openstreetmap.org/way/366172605) | Matching hotel name, Road 41, house 47 and Gulshan 2 |
| Dhaka Regency Hotel & Resort | [way 283182556](https://www.openstreetmap.org/way/283182556) | Matching hotel name and Nikunja 2 / Airport Road building |
| RAOWA Convention Halls | [way 366205735](https://www.openstreetmap.org/way/366205735) | Matching RAOWA club complex, VIP Road and operator domain; one complex point represents its halls |
| SKS Convention Hall | [way 367287601](https://www.openstreetmap.org/way/367287601) | Official hall address is SKS Tower; the OSM building is specifically named SKS Tower |
| Police Convention Hall, Eskaton | [relation 21446956](https://www.openstreetmap.org/relation/21446956) | Named Police Convention Hall building on Old Elephant Road adjoining the published Eskaton Garden Road address; its individually inspected business listing matches the operator website and contact |

## Still without a marker

| Venue | Research outcome |
| --- | --- |
| Zam Zam Convention Hall, Mirpur 1 | Individually inspected Maps results include similarly named Mirpur 1 and Mirpur 11 businesses. One names VTCB Tower but has no phone; another shows the operator domain and a nearby point. A branch-specific independently reusable map point was not established. Keep the existing address, phone evidence and search navigation; do not transfer either pin. |
| Nur Community Center | The inspected business listing names the co-located Thai Park restaurant and agrees with the existing phone and Bibir Bagicha area, but no independently reusable hall-specific point was found. Its exact Google Maps link remains available in List view. |
| Popeyes Plus Convention Hall | The inspected listing uses the shorter *Popeyes Convention Hall* name and reports temporary closure. No independently reusable hall-specific point was found; its exact Maps navigation link and closure warning remain available. |
| Dream World Convention Center | The exact Jigatola business listing still reported **permanently closed** on 27 October. An unrelated OSM *dream world* entry is in Mirpur. Keep the existing review warning and navigation link, without a guessed active venue marker. |
| Mardi Gras Convention Hall | The exact Shewrapara business listing still reported **permanently closed** on 27 October. Keep the existing review warning and navigation link; do not imply a currently bookable venue with a new marker. |

The Google Maps business profiles above were individually checked for identity and navigation. Google-derived coordinates were **not** copied into the OpenFreeMap/OpenStreetMap dataset; no Google ratings, reviews, photos or operating hours were copied. Intermittent managed-proxy HTTP 503 errors delayed some rechecks, but the individual profiles named above were inspected once access recovered. The five venues remain accessible in List view and are counted honestly as lacking markers. Reopening, branch identity and precise points need independent operator confirmation or a suitably licensed map source.

## Validation

Schema, field-evidence, duplicate and Dhaka-boundary validation passed for 173 records. All 30 unit tests and 54 browser tests passed, and the production build succeeded. The browser suite covers MapLibre/Leaflet behavior, list/map synchronization, map-area browsing, the selected venue and full-screen controls at 320, 390, 768 and 1440 CSS pixels. No paid map API, backend or root-site configuration was added. Live tile loading remains subject to OpenFreeMap availability and must be checked after deployment; the list/Google Maps fallback remains available.
