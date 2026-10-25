# Validation record — 2026-10-25

- Node 24.19.0, npm 11.9.0; frozen-lockfile reproduction through npm ci.
- Schema/evidence/region/duplicate/phone validation: 8 records pass. Geographic range checks are supplemented by manual consistency checks for the four official Marriott coordinates, all in Dhaka.
- Unit tests: 7 passed (search, aliases, capacity thresholds, unknown handling, distance sorting, storage corruption/stale IDs, Maps links, invalid coordinates, duplicate and evidence rejection).
- Chromium browser tests: 9 scenarios cover empty data; fixture discovery/details/favorites persistence/comparison/call links/map selection/proximity; four responsive widths; real English-only content and neighborhood/category filtering; marker clustering/tile failure fallback; location denial.
- Visual inspection: screenshots at 360, 768, 1366 and 1920 pixels, no horizontal overflow. Mobile filters collapse while neighborhood selection remains visible. Serif headings, restrained forest/ivory palette, no unlicensed photos or decorative venue placeholders.
- Production Vite build passes. Application code and map dependencies are locally bundled. No required paid services or API keys. Production dependencies: npm audit reports 0 known vulnerabilities at this check.
- No critical page errors in the browser discovery scenarios. Browser tests use synthetic records only through request interception; real data remains separately validated and real-content tests use the actual JSON.
- Local production build smoke test under `/dist/` passed: HTTP 200, 8 real records, English content, search, neighborhood filter, details, phone and review links, favorites persistence, comparison and clustered map markers; no page errors.
- Lighthouse 12.8.2, local production build with mobile emulation: performance 98, accessibility 100, best practices 100, SEO 100 after correcting muted-text contrast. These are local measurements, not live-site scores.
- Live browser smoke verification subsequently passed at https://tanzilahmed.tech/venueradar-bd/ with HTTP 200 and 8 real records: English UI, search, neighborhood filter, details, business call link, Google review link, favorites persistence, comparison and map markers; no page errors. Chromium trusts the existing environment proxy CA through its NSS user certificate store; TLS verification remains enabled.

## Deployment status

GitHub repository read access and reported repository admin permissions are available, but POST /repos/tanzilamd/venueradar-bd/pages returns HTTP 403, “Resource not accessible by integration.” The GitHub App credential cannot enable Pages. The owner must choose Settings → Pages → Source: GitHub Actions (or grant the integration repository Pages administration access). Only this project repository is targeted. No personal root-site or custom-domain settings are altered.

Pages was subsequently enabled and workflow 40194195129 succeeded: https://github.com/tanzilamd/venueradar-bd/actions/runs/40194195129 . GitHub reports https://tanzilahmed.tech/venueradar-bd/ with HTTPS enforced and no project CNAME override. This inherits the existing root site domain; no root configuration was changed. Opening the actual URL was denied by the environment proxy (CONNECT 403). The hostname was added to the environment configuration draft for user application. This earlier network blocker was later resolved; the subsequent live browser smoke test passed as recorded above.
