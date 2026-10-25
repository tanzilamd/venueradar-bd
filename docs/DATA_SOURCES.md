# Sources and coverage

## Current admitted venue data

**8 venues, 8 sourced business phone numbers; Dhaka city/district only. This is a small hotel-focused starter set, not a comprehensive directory.**

On 2026-10-25, HTTPS CONNECT requests to overpass-api.de, www.biccbd.com and www.bangladesh.gov.bd were rejected with 403 by the environment proxy. api.github.com was also denied. Native Git read access works. Network additions were saved to the environment draft, but require user application/publication. Later in the session GitHub, Marriott, Pan Pacific and Radisson became accessible. Eight venue records were manually checked against official event pages. No venue information was copied from memory or invented to fill the target. Broader Dhaka research is still incomplete; additional official-site domains have been saved for review. Overpass returned 406, BICC 503, IHG 403; these failures were not bypassed.

## Administrative names

Downloaded on 2026-10-25 from:
- https://raw.githubusercontent.com/nuhil/bangladesh-geocode/master/divisions/divisions.json
- https://raw.githubusercontent.com/nuhil/bangladesh-geocode/master/districts/districts.json

License: MIT, copyright 2014 Nuhil Mehdy; full text in GEOCODE_LICENSE.txt. Eight divisions, 64 districts, retained only as a development reference in docs/reference/bangladesh-areas.json. They are not part of the Version 1 navigation or published venue coverage. English division names Chattagram/Barisal normalized to Chattogram/Barishal. This source establishes an administrative index, not venue coverage. District spelling modernization and a complete upazila index remain research work.

## Map

Leaflet and Leaflet.markercluster are locally bundled. Standard OpenStreetMap tiles load only on map interaction with visible attribution. No prefetch, bulk download, offline cache or tile scraping. Browser cache behavior is retained. See https://operations.osmfoundation.org/policies/tiles/ and https://www.openstreetmap.org/copyright . OSM is a community service with no uptime guarantee. Use the list if tiles fail. At larger traffic levels review a policy-compliant tile provider; no paid dependency is required now.

## Limitations

No ratings are stored. Capacity, facilities, coordinates and phones must be supported by source evidence. Source dates do not imply a currently operating business or active phone. No photos are included because reuse permission has not been established. Synthetic records in tests are clearly labelled TEST ONLY and intercepted within browser tests; they are not shipped in `public/data` or production assets.

## Official venue pages inspected on 2026-10-25

- The Westin Dhaka: https://www.marriott.com/en-us/hotels/dacwi-the-westin-dhaka/events/
- Le Méridien Dhaka: https://www.marriott.com/en-us/hotels/dacmd-le-meridien-dhaka/events/
- Sheraton Dhaka: https://www.marriott.com/en-us/hotels/dacsi-sheraton-dhaka/events/
- Renaissance Dhaka Gulshan Hotel: https://www.marriott.com/en-us/hotels/dacbr-renaissance-dhaka-gulshan-hotel/events/
- Radisson Blu Water Garden Hotel, Dhaka: https://www.radissonhotels.com/en-us/hotels/radisson-blu-dhaka/meeting-events
- Pan Pacific Sonargaon Dhaka: https://www.panpacific.com/en/hotels-and-resorts/pp-dhaka/meetings.html

Four coordinate pairs come from the respective Marriott pages’ official location metadata; two venues have no verified coordinates and are omitted from markers. Capacity: three Grand Ballroom banquet layouts, Renaissance R Events banquet layout, and Radisson Grand Ballroom theatre layout. Sonargaon capacity is unknown. Bengali names are editorial transliterations, not a claim of official Bengali branding. Only individually reviewed business facts are reproduced; no photographs, marketing prose, Google content or bulk third-party database is republished.

- Amari Dhaka: https://www.amari.com/dhaka/meetings-events (Eden Grand Ballroom banquet capacity 200; phone and address on page).
- Dhaka Regency Hotel & Resort: https://dhakaregency.com/meeting (banquet venue classification); https://dhakaregency.com/ (business contact and address). No published capacity on the inspected page.

Additional research attempts: ICCB returned 403; Lakeshore returned 403; Six Seasons presented a CAPTCHA and was not bypassed. Amari and Dhaka Regency became accessible later and were admitted. No record is independently cross-checked yet; all eight are labelled source-checked. Seven have neighborhood assignments; Sonargaon remains neighborhood-unknown pending evidence.
