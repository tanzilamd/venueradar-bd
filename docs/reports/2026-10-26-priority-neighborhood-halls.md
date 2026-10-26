# Priority-neighborhood hall research — 26 October 2026

This manual, additive update covers Moghbazar, Khilgaon, Gopibagh (near Motijheel), Banasree and Badda. It is **not** a complete inventory of Dhaka or of any neighborhood. Eight distinct public event venues were admitted; no existing venue was deleted, renamed or overwritten.

## Method and sources

- Checked all 139 existing records before admission, including aliases, public numbers and nearby map points. The closest new/existing pairs were inspected individually and have separate names, addresses and locations.
- Downloaded the Geofabrik Bangladesh OSM extract dated 25 October 2026. Its published MD5 `8bd7638f132f3748d110309a772ce24e` matched the downloaded PBF; SHA-256 was `d28168641ae088de2db4715318fa637674c2274f67f07cf5223fa5cefbd6a470`. A local Dhaka study rectangle yielded 282 named event-related candidates, many already indexed or not public event venues. Temporary extract and tooling are outside Git. [Geofabrik](https://download.geofabrik.de/asia/bangladesh.html) and [OpenStreetMap](https://www.openstreetmap.org/copyright) data are credited under ODbL-1.0.
- Individually inspected the matching public business listings on Google Maps for name, premise, contact and map point. No automated extraction of Maps results, ratings, reviews, photographs or hours was retained. Checked the first-party [Moghbazar Convention Center site](https://mccl.com.bd/) and its [contacts page](https://mccl.com.bd/contacts/) for business identity, address and published hotlines/landlines. Each admitted record contains its own exact evidence URLs and review date.
- Verified source provenance, Bangladesh coordinates, area naming, phone formatting, source links and JSON/schema consistency. A published number has **not** been call-tested; a listing is not proof of present booking availability.

## Change report

| ID | Area | Sourced phones | Research outcome |
| --- | --- | ---: | --- |
| `bd-moghbazar-convention-center` | Moghbazar | 9 | First-party site confirms venue/address and 8 general contact lines; named Maps listing supplies one further number. |
| `bd-kh-convention-centre-gopibagh` | Gopibagh | 1 | Individually matched public listing at Gopibagh Water Pump Station; distinct from Sadeque Hossain Khoka Community Centre. |
| `bd-blue-moon-party-centre-khilgaon` | Khilgaon | 1 | OSM business point and named public profile agree; mixed restaurant and party venue. |
| `bd-taiking-party-centre-middle-badda` | Badda | 2 | OSM and matching public profile publish different numbers; both are source-qualified and visibly flagged. Mixed restaurant and party venue. |
| `bd-protik-rupsree-convention-center` | Banasree | 0 | Specific hall listing and map point; no hall-specific public number in the checked listing. |
| `bd-mahal-community-center-badda` | Badda | 0 | Specific hall listing at House 42, Road 13; no public number in the checked listing. |
| `bd-shadi-mahal-party-center-badda` | Badda | 1 | Separate hall at 41 DIT Road 5 with a public business number. |
| `bd-kamrul-restaurant-convention-center` | Badda | 1 | Named convention listing and number checked; another nearby restaurant listing's number was not copied. |

**Added:** 8 IDs above. **Modified existing venue fields:** none. **Unchanged existing venues:** 139. **Conflicts:** Taiking's two public numbers differ; neither is call-tested. **Validation failures:** none. **Proposed deletions:** none. `prepare:data` updated collection membership for the added halls; it did not alter the separately browsable hotel group.

| Coverage measure | Before | After |
| --- | ---: | ---: |
| Venue records | 139 | 147 |
| Venues with at least one published/source-qualified phone | 107 | 113 |
| Phone entries | 135 | 150 |
| Distinct normalized phone numbers | 131 | 146 |
| Indexed Moghbazar venues | 1 | 2 |
| Indexed Khilgaon venues | 3 | 4 |
| Indexed Banasree venues | 3 | 4 |
| Indexed Badda venues | 1 | 5 |

The eight new records all have a mapped point. Five have a street/premises address treated as published; KH Convention Centre, Protik Rupsree and Mahal have partial addresses because a building number or other full-address component was not published in the checked listing. Two have no public phone in the checked source. Seven have no independently established official website. No capacity, facility, price or current-operation claim was added. Area counts are indexed venue counts, not the number of halls that exist locally.

## Held and unresolved

- **Esha Convention Hall, Aftabnagar:** same-name/same-house Maps results include an active-looking profile with a public number and a profile explicitly marked *permanently closed*. The actual branch/operation status remains identity-conflicted. No number was admitted until a first-party source or direct venue confirmation resolves it.
- **Casanova Party Center, Banasree; Spectra Convention Centre, Gulshan:** OSM candidates matched profiles marked permanently closed. Neither was added.
- **Protik Rupsree Convention Center:** a similarly named housing complex has a phone, but its ownership/booking relationship to the convention hall is unproven. Hall phone remains unknown.
- **Mahal Community Center:** no number on the checked named listing. Search for a first-party operator page or call-tested contact in a future explicit research pass.
- **Taiking Thai - Chinese Restaurant and Party Centre Limited:** OSM publishes `+8801971880028`; the individually matched Maps listing publishes `+8801811880022`. Both are kept with source/date and a visible warning; direct contact is needed to learn the best booking number.
- **Mixed-use party venues:** Blue Moon, Taiking and Kamrul have restaurant operations as well as named event space. They are labeled according to their documented mixed use, not advertised as dedicated wedding-only halls.

The detailed candidate decisions and duplicate review are preserved in `public/data/curated.json`; per-field evidence is in `public/data/venues.json`. Future additions should follow [the update guide](../DATA_UPDATE_GUIDE.md) and run `npm run validate`, `npm test` and `npm run build` before publishing.
