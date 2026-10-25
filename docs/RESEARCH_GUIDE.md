# Research admission process

Research is manual, only when explicitly requested. No scheduled scraping is present.

1. Discover candidates in Dhaka only using OSM (ODbL with attribution), official venue sites, and suitably licensed directories. Read access rules/robots before collecting; never circumvent denials. Keep candidate notes separate from admitted records in `data/curated.json`.
2. Do not admit generic OSM community centres without evidence of an actual event venue. Establish name, category and address from sources inspected in this session. Record exact source URLs, fields supported, check dates and reuse basis. Do not copy promotional prose or photographs.
3. Seek first-party business phone numbers, facilities and published capacity. Normalize Bangladeshi numbers to +880, removing a domestic leading 0. Preserve landlines; validate length against the actual numbering plan. A publication is not a successful call. Use `published-not-call-tested`. Never infer WhatsApp.
4. Verify division, district, area and address consistency. Coordinates are optional: use null instead of placing an approximate marker. Check a reliable geographic source and Bangladesh boundary, not just the validator's broad bounding rectangle. Record coordinate provenance.
5. Record capacity layout (banquet/theatre/standing) with the published number. Do not mix incompatible layouts or infer from photos. Unknown facilities are unknown, not absent.
6. `source-checked` means the cited source was inspected. `cross-checked` requires genuinely independent corroboration, not two copies of one source. It is not an endorsement or an assertion the business is operating today.
7. No stored Google ratings, review counts, reviews or photos. A Google Maps search link lets visitors find live information; it does not confirm a unique Maps listing. Verify exact listing links manually in later research if available.
8. Prioritize thoroughly researched Dhaka neighborhoods and public event venues, especially community centers beyond hotel properties. Do not expand outside Dhaka during Version 1. Never fill a quota with invented data. Describe actual coverage. Source access problems must remain blockers, not an excuse to claim completed research.

The validator enforces field evidence, region relationships, plausible coordinate ranges, phone formatting and duplicate warnings. It cannot establish source truth, exact national boundaries, working phone lines or legal permission. Human/source review remains mandatory.
