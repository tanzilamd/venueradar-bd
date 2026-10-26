# Dhaka halls and nearby-area follow-up

26 October 2026. Baseline: `3f2b5aaa739f719f0ba70f36e848b1a7492bc54b` (129 active records). This is the current follow-up to the contact-first revision, not a claim that every Dhaka hall or telephone has been found.

## Added halls

Each named public business profile was individually inspected. The phone, business point and address refer to that matching venue. Published contacts have not been call-tested. No Google ratings, review counts, reviews, photographs, business hours or bulk Places export were retained.

| Hall | Browsing area | Public phone | Address detail |
|---|---|---|---|
|Grand Shahjahan Convention Hall|Kajla|01911918198|Banga Press landmark; premises address remains incomplete|
|Kara Convention Center|Bakshibazar|01769971734|30/3 Umesh Nandakumar Dutta Road|
|BGB Banquet Hall|Jigatola|01714116155|Shimanto Shombhar, 4th Floor, Road 2|
|Sayeedana Community Centre|Dhanmondi|01842191493|House 36, Road 9/A, Residential Area|
|The Grand Palace Convention Hall|Khilkhet|01911331122|300 ft Purbachal Road; premises address remains incomplete|
|Uttara Party Center|Uttara|01868099615|Rajlaxmi Complex, Latif Emporium, House 27, Road 7, North Side|

Exact source URLs and dates are in each record and `docs/research/2026-10-26-additional-halls.json`. OSM locality hierarchies are retained with ODbL attribution in `public/data/area-reviews.json`. Geocoder nearest-object names and conflicting street/postal details were not substituted for the venue's published address. All six points pass the actual Dhaka metropolitan polygon check.

Duplicate checks considered names, aliases, contacts and proximity. None of these six phone numbers was in the previous directory. BGB is approximately 65m from Shimanto Convention Center, but publishes a different business name, booking line and Shimanto Shombhar premises; the existing operator-backed Shimanto Square record is preserved separately. Grand Shahjahan is not the existing Grand Convention Hall in Bakshibazar. Uttara Party Center is approximately 664m from the separately named Uttara Community Centre.

## Consistent zones and nearby browsing

The owner's report exposed inconsistent granularity: Ananda used the broader Paltan zone while Jonaki used the smaller Naya Paltan locality. Their inspected business points are approximately 260m apart along the same local road corridor. Both now use the broader **Paltan** browsing zone; Jonaki's Naya Paltan address is preserved, and no coordinates were moved.

Paltan and Naya Paltan filters explicitly share that browsing group. Both return the same corridor. Motijheel and Naya Paltan are linked in both directions; nearby results retain their own zone labels. All existing one-way nearby relationships were made reciprocal, and reviewed links were added for the remaining indexed browsing areas, including Kajla. Shared groups use the union of their nearby links and do not list their own group members as nearby alternatives. These are curated browsing suggestions, not surveyed boundaries, travel routes or driving distances.

A separate bug was found while checking this: enabling nearby neighborhoods was omitted from shared URLs and reverted to the default on reload. The URL now explicitly records `nearby=1` or `nearby=0`. Unit, browser and production live checks cover this behavior.

## Before and after

| Metric | Baseline | This revision |
|---|---:|---:|
|Active directory records|129|135|
|Hall/community/event records in the default collection|121|127|
|Preserved hotel venues in the separate collection|8|8|
|Venues with a callable contact|96|102|
|Venues with sourced published contacts|95|101|
|Published contact entries|118|124|
|Distinct sourced public numbers|114|120|
|Complete premises addresses|47|51|
|Mapped positions|121|127|
|Published numeric/range capacities retained internally|13|13|
|Records with documented facilities retained internally|39|39|
|Records without a usable phone|33|33|
|Records without an assigned browsing area|0|0|
|Records carrying an unresolved review notice|21|22|

“Complete premises address” requires `address_status: published`, rather than only a road, landmark, Plus Code or city. Coordinates are published business positions, not surveyed entrances. Fortune's owner-supplied phone remains callable but is excluded from the sourced-published total. Existing records and every previous phone, citation, coordinate, address, facility and capacity were preserved. Six records were added, nine received metadata/zone updates, 120 were unchanged, and none was deleted in this follow-up.

## Remaining research and rejected sources

Eight previously unfinished/missing-contact follow-ups were individually rechecked: Ma, Green House, Officers' Club, Motijheel, Modhubagh, Somrat, Malibagh and Police Plaza. Matching profiles for Ma, Green House, Officers' Club, Motijheel, Modhubagh and Police Plaza do not display a phone or operator website. An additional Officers' Club operator search was challenged and was not bypassed. Somrat did not establish a unique Dholaipar business identity; a similarly named outside-Dhaka venue's contact was not used. The current Malibagh point has a Khilgaon/Malika name and different address; its prior warning and separate owner-confirmed Khilgaon record remain. These outcomes replace earlier network-only follow-up notes without claiming that these businesses have no telephone.

The full **33-record unresolved contact list**, venue names, localities, missing fields and individual outcomes are in `docs/research/2026-10-26-additional-halls-change-report.json`. Closure and identity notices still need direct operator confirmation; “source checked” does not mean every field or current operation has been verified. The seven previously confirmed permanently closed records remain archived from the earlier explicitly authorized revision. No new closure was inferred or record silently removed.

Two linked website candidates were not admitted as verified operator sites:

- `bgbbanquethall.site` serves a generic page with a US +1 (555) placeholder number and unrelated Grand Avenue address. Those facts were rejected; website remains unknown.
- `tgpconvention.com` was linked from the Grand Palace profile, but its robots request encountered a proxy tunnel 403. No bypass or unsupported site claim; website remains unknown.

Khilkhet in Grand Palace's published address differs from the OSM Dumni hierarchy. The explicit published locality is retained with the discrepancy documented. Sayeedana's published postcode differs from the geocoder postcode; the venue's postcode is preserved. All conflicts and website decisions are recorded in `public/data/curated.json`.

## Verification and publication

The earlier application and manager were deployed at `3f2b5aa`. GitHub Actions run `40279621066` completed validation, deployment and actual live Chromium verification successfully. Its report records exact deployed JSON, search/call/details, clean home URL, favorites, comparison, map markers/clusters, mobile layout, social image and manager contacts; no JavaScript errors or failed site assets, nine real map tiles loaded.

This follow-up passes data validation, 27 unit/model/editor tests, 32 browser tests and the production build. Browser coverage includes reciprocal area navigation, Paltan/Naya Paltan grouping, nearby Motijheel, reload persistence, phone actions, accessibility, five screen widths, map interactions and manager behavior. The deployment workflow additionally checks the actual live area JSON and grouped/nearby area behavior. Its run and evidence artifact are the publication authority for this revision; do not infer live success from the local build alone. No new Lighthouse score is claimed.

The initial follow-up deployed successfully in run `40282631232`. Its new live dataset was independently fetched and exactly matched all 135 records; an actual Chrome browser opened Paltan, Naya Paltan and nearby Motijheel, confirmed both halls' common zone and phone actions, reload persistence and 360px reflow with no JavaScript errors. That run's extra verification job stalled while installing browser system dependencies. The workflow now uses Chrome already installed on the standard hosted Ubuntu runner and has a ten-minute job timeout, avoiding repeated apt/browser installation for future directory edits. This changes verification setup only, not deployment permissions or the data.
