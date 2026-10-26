# Contact-first directory revision

26 October2026, Asia/Dhaka. Source checks use UTC25October dates. Baseline:861633f, including the owner's intervening commits. The English interface and Dhaka-only scope remain.

## Result

The public directory now prioritizes hall names, areas/zones, addresses, phones and maps. Capacity, facilities, evidence filters and repeated source paragraphs have been removed from cards, details and comparison. Historical facts remain in JSON. Attribution and source/privacy guidance appear in About and the footer. Favorites, comparison, share links, exact-area browsing, optional nearby areas and clustered maps remain.

The owner now has a graphical manager at manage.html: add/edit/remove, validated draft, import/export, optional direct GitHub publication, conflict protection and archived prior versions. It updates linked metadata together and rebuilds indexes, resolving the earlier workflow failure caused by a phone addition with stale missing-phone metadata and no supporting source.

## Coverage

| Metric | Before | Prepared revision |
|---|---:|---:|
|Directory records|132|129|
|Records with a callable number|95|96|
|Records with sourced published phones|94|95|
|Published contact entries|118|118|
|Distinct sourced business numbers|114|114|
|Records missing an area|1|0|
|Records with no usable phone|37|33|

Numbers are published or owner-supplied business contacts, not call-tested lines. Fortune's owner-supplied01954411222is callable but excluded from the sourced-published total. No WhatsApp support or current-operation guarantee is inferred. An area is a reviewed browsing locality, not a surveyed boundary. Coverage remains incomplete.

## Requested records

- The Waterfront Convention Hall: Rampura, IslamTower464/HDITRoad,01761234567. Business profile links waterfrontbd.com; the operator domain could not be fetched through the environment, so no extra site claims were made.
- LakeView Grande Convention Hall:464DITRoad,01710344299. The published Rampura/Hatirjheel label follows the matched premises; OSM's broader MerulBadda/Gulshan hierarchy differs and is documented. This is a separate named hall at the same building, not a duplicate ofWaterfront.
- Police Plaza Convention Centre: House2Road144PolicePlaza, Gulshan. Business profile and point matched; its phone field is absent. Other search/operator access was limited. No shopping-mall line was substituted.
- Elite Convention Hall:76BirUttamMirShawkatSarak,01897913512. Browsing areaNiketonfollows matched road/address hierarchy; full postal locality should be confirmed directly.
- Jonaki Convention Hall:01762884405andpublishedpoint independently corroborated; NayaPaltanquarter and JonakiCinemaHallLane established through OSM hierarchy. Pending submission status was resolved.
- Fortune Convention Hall: name matched, number01954411222supplied explicitly by owner. The number is labelled owner supplied until independently corroborated.
- Khilgaon Community Center: owner's confirmation resolves the historic position warning. The Maps action now opens that coordinate directly, avoiding the differently located Khilgaon/Malika business result. No number was copied from that other record.

## Closed records removed

Aangan, Talukdar, GolamMorshed, Casanova, ATNAnandaUllash, Kazi and Spectra were individually rechecked and their matching business profiles report permanent closure. They were removed from active results under the owner's explicit instruction and preserved in docs/archive/venues.json with source URLs and reasons. ATN's historic point conflict remains in the archive. Temporarily closed Bilkis and MouloviBazar were retained with notices. A differently named closed restaurant at the CityLounge search result does not establish the historic venue's exact identity; it was not silently deleted or assigned the restaurant's number.

## Validation

24 model/editor/data tests and31browser tests passed. Coverage includes phone normalization, stale metadata removal, hidden-field preservation, duplicate detection, geographic validation, source handling, imported JSON, draft restore/removal/discard, optional token non-persistence, owner commit attribution, non-forced ref update, archived deletions and conflict rejection before mutation. The public regression suite covers search, exact/nearby areas, missing information, favorites, comparison, map clustering/selection/failure fallback, geolocation/privacy, loading/retry, keyboard/mobile filters, five responsive widths and axe scans. The production build includes both index.html and manage.html; the manager's validation bundle is loaded only on that page.

## Remaining phone information and access limits

All records missing a phone were individually investigated or retried. At this historical checkpoint, seven requests (Ma, Malibagh, Green House, Somrat, Officers Club, Motijheel and Modhubagh) failed/rendered unavailable during an environment HTTP503 incident. They were subsequently rechecked; see the additional-halls follow-up report. Earlier facts were preserved; inaccessible material was not claimed as checked. Other profiles either publish no contact or do not establish the same business identity. RUAP's mall line and Rupsha's hotel line were not borrowed as hall-booking numbers. Google/DDG challenges, Brave429, Facebook collection restrictions and inaccessible operator domains were respected. No fabricated phone, restricted API export, stored ratings/reviews or copied photographs were added.

| Venue without a phone | Area | Latest outcome |
|---|---|---|
|Al Hera Community Centre|Kamrangirchar|No public phone or additional authenticated operator site in the individually inspected matching business entry. Existing facts retained.|
|Bilkis Community Center|Kamrangirchar|No public phone or additional authenticated operator site in the individually inspected matching business entry. Existing facts retained.|
|Ellin Community Center|Badda|Eleen name variant has restaurant category; no authenticated hall-booking contact.|
|Ashkona Community Center|Ashkona|Current AgrajatraLegalProfessionalHouse differs from historic Ashkona identity; no contact borrowed.|
|Grand Convention Hall|Bakshibazar|Grand query returns other differently located venues, not an exact verified Bakshibazar match.|
|Kholil Shordar Community Centre..|Hazaribagh|No safely matched KholilShordar business profile/contact among other OldDhaka results.|
|Bengal Spicy Party Center|Uttara|Other Uttara restaurant/party results do not establish BengalSpicy identity.|
|RUAP Community Centre & Shopping Mall|Uttara|RUAPcommercialcomplex is currently a shopping mall;01730017321notestablished as hall-booking contact.|
|Shamsun Community Centre|Basabo|No public phone or additional authenticated operator site in the individually inspected matching business entry. Existing facts retained.|
|Joj Community Center|Bawnia|Joj search returns JoyConvention and other centers in different areas; no unique Bawnia contact.|
|Rupsha Community Centre|Panthapath|HotelRupshaInn01324762303notestablished as hall-booking line. Linkedoperatorrobotsunavailable503.|
|Al Fuad Community Center|Mirpur|No public phone or additional authenticated operator site in the individually inspected matching business entry. Existing facts retained.|
|Bandhan Community Center|Doyaganj|No public phone or additional authenticated operator site in the individually inspected matching business entry. Existing facts retained.|
|City Lounge and convention center|Doyaganj|Different-name DhakaRestaurantPartyCenter is permanentlyclosed. HistoricCityLoungeidentityuncertain, so no borrowed phone or deletion.|
|Jononi Community Center|Mirpur|Jononi search yields other Mirpur venues; no uniquely matched booking contact.|
|Suborna Community Center|Mirpur|No public phone or additional authenticated operator site in the individually inspected matching business entry. Existing facts retained.|
|Efa Convention Center|Mirpur|No public phone or additional authenticated operator site in the individually inspected matching business entry. Existing facts retained. Facebook business link exists, but automated Facebook collection is excluded.|
|Chowdhury Community Center,|Jigatola|Chowdhury query yields Sayeedana/Prianka/event-services, not an authenticated matching record.|
|Ward 4 Community Centre (DNCC)|Mirpur|Ward4currentresult is a shoppingcomplex/market, with no established dedicated hall-booking contact.|
|Moulovibazar Community Centre|Armanitola|No public phone or additional authenticated operator site in the individually inspected matching business entry. Existing facts retained.|
|Reza Community Centre|Armanitola|Reza search resolves ArmanitolaField, a different name/use; no hall contact established.|
|Khilgaon Community Center|Khilgaon|Owner confirms original Khilgaon point. Common Malika profile is a different position and has no published phone.|
|Sadeque Hossain Khoka Community Centre|Gopibagh|No public phone or additional authenticated operator site in the individually inspected matching business entry. Existing facts retained.|
|Jigatola Community Centre|Jigatola|No public phone or additional authenticated operator site in the individually inspected matching business entry. Existing facts retained.|
|Pallabi Community Centre|Mirpur|Pallabi query includes similarly named Sylhet venue and other Mirpur halls. No outside-Dhaka phone borrowed.|
|Malibagh Community Centre|Malibagh|Additional source request unavailableHTTP503; earlier source facts preserved. This does not prove the venue has no telephone.|
|Ma Community Center|Bawnia|Additional source request unavailableHTTP503; earlier source facts preserved. This does not prove the venue has no telephone.|
|Green House Community Center|Jurain|Additional source request unavailableHTTP503; earlier source facts preserved. This does not prove the venue has no telephone.|
|Somrat Community Center|Dholaipar|Additional source request unavailableHTTP503; earlier source facts preserved. This does not prove the venue has no telephone.|
|Officers' Club Dhaka|Ramna|Additional source request unavailableHTTP503; earlier source facts preserved. This does not prove the venue has no telephone.|
|Motijheel Community Center|Motijheel|Additional source request unavailableHTTP503; earlier source facts preserved. This does not prove the venue has no telephone.|
|Modhubagh Community Centre, Hatirjheel|Madhubag|Additional source request unavailableHTTP503; earlier source facts preserved. This does not prove the venue has no telephone.|
|Police Plaza Convention Centre|Gulshan|Matched named business and published location; capacity/facilities not collected in simplified contact directory.|

## Publication status

Application revision8d037be4a10b00fa0c7852a36cc51c30c391f63bwas normally pushed after861633f. The GitHub commit API verified author and committer as TanzilAhmed,59307135+tanzilamd@users.noreply.github.com, associated withtanzilamd. Pages workflow40245654430completed successfully. No root-site, domain or CNAME settings changed.

Public-internet research and local live-site requests still encounter intermittent environmentHTTP503. A post-deployment real-browser verification job now checks the actual production URL and publishes its JSON/screenshot evidence as the live-verification Actions artifact. Check the latest run for the final outcome; local preview success alone is not a live-verification claim.

At this historical checkpoint, six additional candidates were blocked by environment HTTP503. On 26 October all six were individually inspected, checked for duplicates and admitted with sourced phones and positions. The current dataset and remaining gaps are reported in [the additional-halls follow-up](2026-10-26-additional-halls.md). There is still no complete-Dhaka coverage claim.

Final production-preview smoke used the actual repository subpath, including manage.html. New Waterfront contact, Fortune editing, clean logo navigation, 360px reflow and asset loads passed with zero JavaScript errors or failed local assets. Desktop/mobile public pages and the editor were visually inspected. No new Lighthouse score is claimed for this revision. The original four environment CA certificates remain; no temporary trust entry was left.

## Subsequent verified deployment and data follow-up

Commit `3f2b5aa` was normally pushed, and run `40279621066` passed all three jobs including actual production Chromium verification. The downloaded live report records success, no JavaScript errors or failed site assets, nine loaded OSM tiles and three clusters. Later six-hall additions and nearby-area corrections are documented in [the current follow-up report](2026-10-26-additional-halls.md); the coverage table above describes this earlier revision.
