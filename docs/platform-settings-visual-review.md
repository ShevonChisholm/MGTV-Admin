# Platform Settings admin visual review

29 October 2026. Local implementation verified; preview deployment pending. Careers was published first and hosted-verified (see careers-preview-release.json).

## Changes

- MGTV saved-configuration summary, version badge and focused Organization & defaults, Staff preferences, and Review & history sections.
- Native labelled keyboard-operable preference switches. Every preference explicitly says delivery is pending; no alert delivery or scheduled digest was enabled.
- Review changes now opens a saved-versus-draft comparison. The actual Save settings action remains gated by read/manage permission, pending changes, a reason of at least five characters, busy state and version-conflict state.
- Validation returns to Organization & defaults so highlighted organization/email errors are visible. Discard restores all saved values and clears the reason/error state.
- Readable history reasons, human field labels, Jamaica timestamps and immutable version snapshots. Existing history pagination and conflict/reload dialog remain intact.
- Existing API operations, idempotency/version checks, permissions and field semantics are preserved. Independent settings/history reads run in parallel after staff read permission is checked.
- Isolated platform-v styles; no new dependencies, schema/API changes, credentials or provider changes.

## Verification

- Admin TypeScript and Vite production build passed; final bundle index-MV54TytK.js. Existing bundle-size warning remains.
- Existing Platform Settings integration suite: 7 passed, 0 failed in an isolated local test database. Covers public allowlist, read/manage separation, strict input, CSRF, stable idempotent retries, concurrent saves, immutable/private history, support/event-default behavior, seed preservation and history pagination. Log: apps/api/.data/settings-visual-contract-test.log.
- Normal local staff session at http://127.0.0.1:5894/admin/settings. All 20 responsive checks passed at 320/390/768/1440px: organization, staff preferences, no-change review, expanded history and pending-change review. No page/descendant horizontal overflow and no captured browser warnings/errors.
- Toggling weekly digest changed only the local draft. Review showed saved Preference off versus draft Preference on, retained saved version 1, and disabled Save until a valid reason was entered. Discard restored the draft. No successful Settings save was executed in the browser.
- Invalid support email plus a reason triggered client validation, returned to Organization & defaults and marked the email field, without saving. Discard cleared it.
- Space key operated the native weekly-digest switch. Final discard restored all three saved preferences to false; saved configuration remained version 1. History expansion showed the immutable saved snapshot.
- No actual concurrent-conflict dialog or earlier-history page was forced in this browser session; the existing API suite covers those conditions. Production email and any staff-delivery implementation remain outside this pass.

Evidence in the local Codex visualization folder: platform-settings-organization-desktop.png; platform-settings-review-desktop.png; platform-settings-preferences-mobile.png.

## Deferred

Platform Settings preview deployment pending. DRM, production email/domain/inbox, staff alert delivery/digests and other existing launch/workflow gaps remain separate. No further area started.
