# Permission-aware navigation and mobile summaries

Local review: 30 October 2026. Deployment pending.

## Behavior

- The existing verified staff-session response supplies explicit permissions to navigation. No role-name shortcuts or new access grants.
- Sidebar groups and workspace search contain only readable modules. Content and Music Library links choose an allowed subsection. The sign-in landing destination is the first allowed workspace.
- Restricted deep links show an access message before mounting the module or its partnership panel. Server guards remain the authorization boundary; hiding a link does not grant or revoke API access.
- Moderation counts are requested only with moderation.read, refreshed on focus or moderation events, and no longer fetched on every route change. Stale responses and removed listeners are ignored after permission changes.
- Communications and editorial/music-library tabs honor their resource read permissions. Communications clears the old view if its current tab loses read access.
- Settings and Careers summaries take less space on smaller screens. Careers create action uses a full row on mobile to avoid broken button text.

## Verification

- TypeScript check and production Vite build passed. Existing large-bundle warning remains; no dependencies added.
- Five isolated policy/component regressions passed with `node --experimental-vm-modules scripts/check-navigation-access.mjs`. Covers explicit permissions, grouped destinations, no unauthorized moderation-count calls, route-change deduplication, revocation cleanup and permitted search/collapse reset.
- Normal local administrator browser: workspace search, collapse/expand filter reset, mobile menu, Escape and focus return passed. Content Movies, bare Music Library entry and Communications subscribers/newsletters loaded through existing API access.
- Settings and Careers loaded at 320, 390, 768 and 1440px; eight page-width checks passed without horizontal page overflow. Visually inspected mobile Settings/Careers and desktop search. Final mobile Create vacancy button wrapping corrected and rechecked.
- No captured browser warnings/errors in the local review tab. Temporary viewport override reset.
- Restricted permission combinations are component-tested, not browser-tested with a real restricted staff account. No actual staff permissions or credentials were changed. Hosted verification remains after deployment.
- No module records saved, provider processing, uploads, email delivery, API changes or access grants.

Evidence: navigation-settings-mobile.png, navigation-careers-mobile.png and navigation-workspace-search.png in C:/Users/chish/.codex/visualizations/2026/10/22/01a16480-a614-7543-80c2-fac991b681e9/.

DRM and production email remain pending. Stop before another area.
