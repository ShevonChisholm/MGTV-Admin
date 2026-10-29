# Careers admin visual review

29 October 2026. Local implementation and verification; preview deployment pending.

## Presentation

- MGTV vacancy directory with structured role cards, icon facts, explicit status/expiry markers and loaded-result summaries. Six cards per local page; existing API pagination still loads another 30 records.
- Submitted search and status filters use the existing Careers API. Search/reset and subsequent keyset requests preserve the same filters. Counts describe loaded matching records, not a global workforce or applicant count.
- Each vacancy has Saved overview, Edit draft, Public snapshot and Version history views. Saved/public snapshots render their own persisted bodies, not unsaved fields. Public snapshot is unavailable when there is no published body.
- Saved overview shows team, location, workplace, employment, closing date, role description, requirements and the external recruitment destination. Publication remains a separate, reasoned decision on the saved version.
- Retained the existing required fields, explicit read/manage/publish permissions, idempotency keys, reviewed-version checks, closed-draft lock, route dirty guard and external application model. No applications or resumes are collected inside MGTV.
- Scope-specific career-v class names prevent Careers styling from affecting Content Library or other admin screens. Global definition-list alignment was explicitly reset inside the role facts.
- No dependencies, API/schema changes, access grants or provider configuration changes.

## Verification

- TypeScript passed. Final Vite production build passed (index-0OyMXIZW.js); existing bundle-size warning remains.
- Existing Careers integration suite: 11 passed, 0 failed in an isolated local test database. Covers authentication/permissions/CSRF, idempotent creation, private drafts/public projection, stale writes, manage-versus-publish separation, close/reopen, server expiry, application URL safety, strict inputs, bounded keyset pages and seed preservation. Log: apps/api/.data/careers-visual-contract-test.log.
- Normal local staff browser at http://127.0.0.1:5894/admin/careers. Final 24 containment checks passed: directory, saved overview, draft editor, public snapshot, version history and new vacancy at 320, 390, 768 and 1440px. No page or descendant horizontal overflow and no captured browser warnings/errors.
- Role search returned the matching editor; a nonmatching search showed the empty state; Reset restored the list. Closed status returned the closed role.
- Temporarily changed the editor title in memory, switched to public snapshot and confirmed the original published title remained. Publication was disabled while unsaved edits existed. Restored the exact original title before navigation; nothing was saved or published.
- Closed vacancy fieldset was disabled; publish/close were disabled and Reopen as draft remained the appropriate permitted action. Public snapshot was disabled for the closed vacancy.
- Expanded a recorded revision to inspect its reason and role summary. Opened the reasoned Close confirmation then cancelled it without executing a command.
- Empty new-vacancy submit remained on /admin/careers/new, focused the required title and showed native required-field validation. No record was created.
- Pagination beyond the first local/API page and an expired-role browser record were not exercised because the local catalog contains four future-dated vacancies. Existing API tests cover disjoint keyset pages and authoritative expiry. No fake vacancies, applicant counts or expiry data were added for the visual check.

Evidence in the local Codex visualization folder: careers-directory-desktop.png, careers-overview-desktop.png and careers-overview-mobile.png.

## Deferred

Preview deployment is pending. DRM, production email and other existing workflow/API or launch decisions remain separate. Stop before Platform Settings.
