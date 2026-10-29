# Dashboard and Analytics visual review

29 October 2026. Local implementation; not deployed to the hosted preview.

## Presentation

- Dashboard: current moderation/campaign/event queues, audience KPIs, daily playback chart, catalog-type counts and searchable recent audit activity.
- Analytics: 14/30/90-day periods, explicit audience source, three chart metrics, keyboard-operable date inspector, exact daily table with date search and ten-row pagination, device ring/legend, top-title search/type/sort controls, completed-month retention and metric definitions.
- MGTV charcoal/gold tokens, quiet icon backgrounds, readable typography and responsive labelled rows. Dedicated chart placeholders accompany the shared loading skeleton. Error/retry and explicit analytics.read access messages remain available.
- Current operational counts are labelled separately from the audience reporting period. The Discovery index is not described as viewing popularity. Missing retention baselines stay unavailable. Small daily averages retain two-decimal API precision.
- Links require the corresponding explicit read permission. Episode rows open the content library because this report does not contain the parent IDs required for a direct episode route. Ambiguous/unlinked audit events do not receive invented destinations.
- Existing server reporting, staff/customer authentication, permissions and customer playback remain unchanged. No provider jobs, email delivery, financial operations, data edits or access grants were performed by this visual pass.

## Verification

- Admin TypeScript: passed. Vite production build: passed. Existing bundle-size warning remains; no chart library or other dependency was added.
- Existing Analytics integration suite: 8 passed, 0 failed, using an isolated temporary local database. Includes permission/auth separation, strict filters, bounded playback, qualified/completed totals, synthetic seed isolation, Jamaica midnight boundaries and unpublish enforcement. Output: apps/api/.data/analytics-visual-contract-test.log.
- Browser: normal authenticated local staff at http://127.0.0.1:5894. Dashboard and Analytics page/descendant containment checked at 320, 390, 768 and 1440px; no horizontal page overflow.
- Exercised 14/30/90-day reports, all three chart metrics, zero-day inspection, daily date filtering, daily table page 2, title search/no-match/type/sort, recent-activity filtering, dashboard-to-report navigation, moderation queue navigation and a real movie detail link. Final 90-day average displayed 0.03 rather than rounding down to zero.
- Visual checks caught and fixed narrow-screen table-caption letter stacking and retention label wrapping; device-ring text uses the correct MGTV text token.
- Synthetic audience option is hidden in this local review because development analytics is disabled there. Source isolation and disabled-source rejection passed the API tests. Permission-denied and entirely empty-report browser states were not simulated; API tests cover authorization and source rejection, and zero-day/no-match states were inspected in-browser.
- One reload overlapped replacement of the local dist assets during a build; reloading the completed build resolved it. This was a review-server rebuild interruption, not a hosted deployment failure.

Evidence (local Codex visualization folder): analytics-charts-desktop.png; analytics-mobile-retention.png. No hosted release is claimed.

## Deferred

DRM and production email remain pending. Subscriber-growth/revenue reporting, partnership financial execution and all other existing module gaps are outside this visual pass. Next visual area: Contact & Newsletter; not started.
