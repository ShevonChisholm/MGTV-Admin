# Discovery and Commerce reliability repairs

30 October 2026. Implemented locally; preview deployment not performed.

## Discovery

The category contentKinds maximum now follows KINDS.length rather than a hardcoded 11. All 12 registered kinds, including Podcasts, can be selected together. Unknown values, duplicates, oversized arrays, permissions, CSRF/version checks and existing category semantics remain enforced. No schema migration or data repair is required.

Verification: API TypeScript build passed. Three standalone DTO regressions passed. One focused existing publishing-suite integration passed in its generated, disposable mgtv_test database: unauthorized create denied; create/read/update persist all 12 kinds; unknown and duplicate kinds rejected. The suite completed with zero failures. It emitted lifecycle/notification retry messages during cleanup; those are not a claim of a new worker fix. No development/preview category was changed. Log: apps/api/.data/discovery-all-kinds-regression.log.

## Commerce

Product option slot dates are formatted explicitly in each option's recorded IANA timezone, instead of the staff browser's timezone. Both endpoints include dates and times, with the zone printed once. Missing/invalid schedule values show Schedule unavailable, avoiding misleading browser-local or 1970 fallback dates. Existing product layout, stored instants, capacity, checkout, payment and booking policies are unchanged.

Verification: admin TypeScript and Vite production build passed. Three focused regression tests passed for different staff default timezones, a New York daylight-saving transition and missing/invalid schedules. The existing bundle-size warning remains. Normal local staff browser verification is pending sign-in at http://127.0.0.1:5894/admin/commerce. No authentication bypass or credential reads.

Commands:
- API: node node_modules/typescript/bin/tsc -p tsconfig.json
- API: node --test dist/test/discovery-validation.test.js
- API: node --env-file=.env --test --test-name-pattern="Discovery: all registered category types persist" dist/test/publishing.test.js
- Admin: node --test scripts/check-commerce-time.mjs
- Admin: node node_modules/typescript/bin/tsc --noEmit
- Admin: node node_modules/vite/bin/vite.js build

## Boundaries

No preview deployment, permission grants, schema migrations, commercial/provider setting changes or paid jobs. DRM and production email remain pending. No next enhancement started.
