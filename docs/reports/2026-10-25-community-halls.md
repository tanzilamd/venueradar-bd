# Dhaka community and convention hall expansion

## Changes

Added 3 non-hotel venue records:

| ID | Venue | Area | Capacity evidence | Public business contacts |
| --- | --- | --- | --- | --- |
| bd-police-convention-hall-eskaton | Police Convention Hall, Eskaton | Eskaton | 800 per floor; layout unspecified | 2 consistent booking mobiles and a public landline |
| bd-raowa-convention-halls | RAOWA Convention Halls | Mohakhali | Unknown from inspected text | Public RAOWA office landline and mobile; not a dedicated booking line |
| bd-sks-convention-hall | SKS Convention Hall | Mohakhali | Sena Gourab published range 400–500; layout unspecified | Published hall-booking number |

Existing venue objects modified: **0**. Unchanged existing venue objects: **8**, verified against the pre-update JSON snapshot. Proposed deletions: **none**. New hotels: **0**. New neighborhoods: Eskaton and Mohakhali. Total: **11 records with sourced business contacts**, containing **14 published numbers**. Eight records have capacity evidence, including the SKS range. Four have previously verified coordinate pairs.

Source URLs:
- https://policeconventionhall.com/wp/
- https://policeconventionhall.com/wp/contact-us/
- https://raowa.org/
- https://raowa.org/Terms-Conditions-Non-Member/
- https://raowa.org/contact-us/
- https://senakalyan.org/dynamic_page/load_page/43

These are manually inspected first-party pages. Only public business facts are admitted; no photographs, personal staff contacts, booking calendars, private schedules, or security details are collected into the database. Telephone lines were not called and WhatsApp support is not assumed.

## Conflicts and uncertainty

One Police Convention Hall mobile appears with inconsistent digit counts between the site header and contact block. That number is omitted; the conflict is preserved in curated.json. The other booking contacts and landline are consistently published.

RAOWA's office contact is shown explicitly as an office contact in notes. Numerical hall capacity is not guessed from photographs or room names. SKS publishes ranges for Sena Gourab (400–500) and Sena Cafe (200–250); one venue record covers the location, with the Gourab range displayed and the smaller space described in notes. The two hall ranges are not summed. Police Convention Hall is represented once, with capacity per floor rather than its combined two-floor headline.

No new coordinates were verified, so none was invented. These records remain discoverable in the list, with Google Maps search/navigation links and clear missing-coordinate messages.

## Remaining coverage and access limitations

**This does not complete the owner's request for all Dhaka community centers and convention halls.** Eight of the eleven records remain hotel venues. Many requested neighborhoods still have no independently verified venue record. No complete citywide source inventory was available during this update.

Research attempts and outcomes:
- OpenStreetMap Overpass providers (overpass-api.de, overpass.kumi.systems, overpass.private.coffee): unavailable responses or read timeouts, including a smaller-area query and the documented POST API route.
- Geofabrik Bangladesh extract: environment proxy rejects CONNECT with 403. The domain requirement was saved to the environment draft; it must be applied before download/research can proceed.
- DNCC/DSCC and portal hosts: proxy denial or upstream 503. No municipal list was retrieved or copied.
- ICCB official host: upstream 503; no unsupported ICCB record was admitted.
- Several other prospective operator domains remain inaccessible. No claim about their venue details is based on a failed request.

Next work is source access followed by a systematic neighborhood inventory, duplicate checks, explicit event-venue classification and phone verification against public business sources. Do not fill gaps with names or contacts from memory. Keep undiscovered/blocked candidates separate from admitted venue records.

## Validation and attribution

Schema and evidence validation: **11 records pass**. Unit tests: **8 pass**. Browser scenarios: **10 pass**, including real new-venue filtering, booking links, range display, and English-only details. Production build passes. No existing venue field was replaced with weaker or empty data.

Commit identity was configured repository-locally as Tanzil Ahmed <59307135+tanzilamd@users.noreply.github.com>. GitHub independently confirms commit 39510704e671d4147595add927e9910cb9a4b18b has author and committer login `tanzilamd`. No history rewrite or force-push was used. The data commit must receive the same remote verification after pushing.
