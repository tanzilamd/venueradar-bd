# Dhaka halls and contact update — 26 October 2026

This is a non-destructive, manually researched addition to the Dhaka directory. A published contact is not a call-tested line. The cited venue-specific Humayra pages are third-party booking listings, not operator verification. No ratings, reviews, photographs or restricted Places data were retained.

| Measure | Before | After |
|---|---:|---:|
| Active venues | 135 | 139 |
| Venues with sourced phones | 102 | 107 |
| Phone entries | 125 | 134 |
| Distinct phone numbers | 121 | 130 |
| Active venues without sourced phones | 33 | 32 |

## Added

- Dream World Convention Center — Jigatola — two public contacts: https://humayra.com.bd/product/dream-world-convention-center/
- Mardi Gras Convention Hall — East Shewrapara — one public contact: https://humayra.com.bd/product/mardi-gras-convention-hall/
- Nur Community Center — Jatrabari/Bibir Bagicha — one public contact: https://humayra.com.bd/product/nur-community-center/
- Popeyes Plus Convention Hall — Mirpur 12 — one public contact: https://humayra.com.bd/product/popeyes-plus-convention-hall/

All four have a source-published address and phone. Exact coordinates were not established, so no marker was invented; the Maps action opens a search. Current operation and phone connectivity remain untested.

## Modified

- Efa Convention Center: added +8801957257979 from https://humayra.com.bd/product/efa-convention-center/ and cleared the stale no-phone review. The old mapped premises number is 63/7, while this booking page says 636/7. The mapped address is retained; operator confirmation is needed.
- DOHS Baridhara Convention Center: retained its existing contact and added +88028413119, +88028412216 and +8801844008863 from https://humayra.com.bd/product/baridhara-dohs-convention-center/.
- Seven previously archived venues now explicitly carry `closure_status: reported-permanently-closed`. They remain excluded from active listings and preserved for audit. This release makes no new closure determination.

The other 133 pre-existing active records are unchanged. No verified value was overwritten. Proposed deletions: none. The Efa address discrepancy is recorded in `curated.json`; no conflicting number was silently merged.

## Unresolved contacts

The prior [all-record contact review](2026-10-26-contact-directory.md) and [additional halls report](2026-10-26-additional-halls.md) record earlier source attempts and identity issues. The following active records still lack a safely matched public business number. This does not establish that the venue has no phone.
- Al Hera Community Centre (Kamrangirchar): not-found-in-checked-sources.
- Bilkis Community Center (Kamrangirchar): not-found-in-checked-sources.
- Ellin Community Center (Badda): identity-unconfirmed.
- Ashkona Community Center (Ashkona): identity-unconfirmed.
- Grand Convention Hall (Bakshibazar): identity-unconfirmed.
- Kholil Shordar Community Centre.. (Hazaribagh): identity-unconfirmed.
- Bengal Spicy Party Center (Uttara): identity-unconfirmed.
- RUAP Community Centre & Shopping Mall (Uttara): identity-unconfirmed.
- Shamsun Community Centre (Basabo): not-found-in-checked-sources.
- Joj Community Center (Bawnia): identity-unconfirmed.
- Rupsha Community Centre (Panthapath): identity-unconfirmed.
- Al Fuad Community Center (Mirpur): not-found-in-checked-sources.
- Bandhan Community Center (Doyaganj): not-found-in-checked-sources.
- City Lounge and convention center (Doyaganj): identity-unconfirmed.
- Jononi Community Center (Mirpur): identity-unconfirmed.
- Suborna Community Center (Mirpur): not-found-in-checked-sources.
- Chowdhury Community Center, (Jigatola): identity-unconfirmed.
- Ward 4 Community Centre (DNCC) (Mirpur): identity-unconfirmed.
- Moulovibazar Community Centre (Armanitola): not-found-in-checked-sources.
- Reza Community Centre (Armanitola): identity-unconfirmed.
- Khilgaon Community Center (Khilgaon): not-found-in-checked-sources.
- Sadeque Hossain Khoka Community Centre (Gopibagh): not-found-in-checked-sources.
- Jigatola Community Centre (Jigatola): not-found-in-checked-sources.
- Pallabi Community Centre (Mirpur): identity-unconfirmed.
- Malibagh Community Centre (Malibagh): identity-unconfirmed.
- Ma Community Center (Bawnia): not-found-in-checked-sources.
- Green House Community Center (Jurain): not-found-in-checked-sources.
- Somrat Community Center (Dholaipar): identity-unconfirmed.
- Officers' Club Dhaka (Ramna): source-limited.
- Motijheel Community Center (Motijheel): not-found-in-checked-sources.
- Modhubagh Community Centre, Hatirjheel (Madhubag): not-found-in-checked-sources.
- Police Plaza Convention Centre (Gulshan): not-found-in-checked-sources.

Existing identity, area and temporarily closed review notices remain visible. These 32 contacts, the four new exact map points, Efa's premises number and the new halls' current operation still need source/first-party follow-up. Some directories explicitly prohibit data reuse; their phone numbers were not copied. This release is an indexed subset, not a claim to cover every Dhaka hall.

## Verification

`npm run validate` passed for 139 records; `npm test` passed 28/28; `npm run test:browser` passed 37/37 across mobile and desktop coverage; `npm run build` passed. These automated checks do not verify whether third-party phone lines are presently active.
