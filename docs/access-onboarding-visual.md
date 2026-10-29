# Roles & Permissions and Staff Onboarding — visual pass

29 October 2026. Preserve the MGTV palette, existing explicit grants and server workflows. No API, schema, provider, account or access-assignment changes. DRM and production email remain pending.

## Layout choices

Roles and resource catalogs use readable tables with icon-led identities, real status/counts, search/reset, ten-row local pagination and detail drawers. On smaller screens rows arrange into labelled blocks without widening the page. Access activity uses the same paginated table; its scope is explicitly the recent records returned by the server.

Role edits use Identity → Permissions → Review. Resource registration uses Registration → Review. Permission groups expand independently; selected groups and search results are easy to inspect. Sensitive direct-only permissions are excluded from role selection. Operations the actor cannot delegate remain disabled. Final review shows the exact name/status/selection and requires a reason; ETags, idempotency and backend checks are unchanged. Cancel retains the explicit discard confirmation. Read-only detail views do not open an edit or write anything.

Staff onboarding uses a filterable queue table, separate journey/account status, loaded-record counts, the existing server Load more cursor and local table pagination. Detail uses six real recorded checks and icon-led milestone tiles, plus separate access and activity sections. Predates-workflow accounts are explicitly not completed. Invitation/delivery state is separate from check progress. Manager actions remain collapsed, reasoned and confirmed. Unsaved action reasons block section switching and refresh, and have an explicit clear control. Enrollment, invitation, cancellation and access review keep the existing permission/state/version/fingerprint conditions. Onboarding never grants access.

## Local checks

- Admin TypeScript and production build pass; existing chunk-size warning remains.
- Unchanged staff onboarding integration suite: 13 passed, zero failures, isolated local test database.
- Normal local staff session used. Roles table/detail; existing role wizard through all three steps; new role empty-name blocking; direct-only content.publish excluded; read/review/back/cancel and discard confirmation checked without saving.
- All 32 registered resources visited across pages of 10/10/10/2, no duplicate rows. Resource search finds content.publish; detail identifies direct-only operations; registration key stays immutable; reasonless Save disabled. No registration or permission changes.
- Roles, resources, activity, open wizard, onboarding queue and detail at 320/390/768/1440px have no page overflow. Wizard has no elements beyond the viewport. Browser warning/error logs empty for reviewed local flow.
- Local onboarding default Open fixture is empty; All statuses returns four existing exempt journeys. Pending colleague detail shows actual zero recorded checks, unissued invitation and exempt explanation. Enrollment disabled until reason; temporary unsaved reason blocked navigation/refresh and was cleared. No enrollment/invitation/review command executed.
- Queue fixtures have fewer than 24 records; server Load more remains intact and is covered by existing cursor integration tests, not clicked in this browser fixture.

Hosted rollout results and exact commit/deployment are recorded separately in access-onboarding-preview-release.json. Evidence is in evidence/access-onboarding-visual/.

Stop before Subscriptions or another admin area. DRM and production email pending.

## Hosted verification

Admin 111c2f7 / dpl_AEqyDqTXq81Pp1zDZqjqEnt13QDx READY at the stable disposable preview. Normal preview administrator session used. Three roles and 32 resources returned; Movie editor detail and all wizard stages read without save, movies search returns read/write only, reasonless Save disabled. Resources second-page navigation shows 11–20 of 32. Open onboarding queue has one pending Preview Editor journey, zero recorded checks; invitation/cancellation/review buttons disabled without a reason. Access/activity panes read. Wizard and journey at 320/390/768/1440px: no page/dialog overflow. Browser warnings/errors empty. Proxy health 200; guest resources/onboarding 401. No hosted writes, grants or messages. See access-onboarding-preview-release.json.
