# Customers, Profiles and Staff Users — visual pass

29 October 2026. Scope: existing admin account directories and details. Customer and staff authentication, separate email identities, explicit permissions, MFA, account state transitions, profile policies and optimistic concurrency remain in place. Roles/Permissions and Onboarding redesigns are separate next areas. DRM and production email remain pending.

## Presentation

- Identity card grids with initials, real account status, country or descriptive staff label, and icon-led facts. No fictitious portraits or activity metrics.
- Loaded-record summary counts, existing server search/status filters, reset, empty/loading/error feedback and cursor Load more. Counts describe the returned list, not a global total.
- Saved overview and separate Account details, Profiles or Access & security, Account status, and Activity sections. Existing forms/actions remain in their sections; section switching is disabled during account/profile/access editing.
- Explicit account-edit discard resets to the last loaded server record without writing. Email stays immutable; pending creation does not activate sign-in.
- Profile cards expose classification, daily budget, parental verification, language and protected main adult status. Stored profiles are distinguished from current plan allowance, including preserved profiles beyond the allowance. Existing protected-main, suspension and capacity restrictions remain.
- Staff permission chips and collapsible permission/role/recovery controls keep the default screen focused. Permissions search uses the registered server catalog; the existing bounded option grid scrolls within the component. No new grants, invitations, recovery actions or role assignments were made.
- Corrected stale profile text: classification and server viewing-budget enforcement already exist. No policy implementation changed. Private customer-uploaded avatar endpoints are not fetched with a staff session; admin profile cards use initials and the stored colour.

## Necessary API correction

The GET /admin/staff/permission-catalog static route was shadowed by StaffController's GET /admin/staff/:id. It now belongs to StaffController before the dynamic route and calls the same AccessService catalog with the same staff.read policy. The duplicate AccessController route is removed. No schema, access grant or permission semantics changed. A regression exercises allowed, guest and missing-permission catalog reads.

## Local verification

- Admin TypeScript and production build pass. Existing bundle-size warning remains.
- API TypeScript build and access/users/profiles suites: 28 passed, zero failures, isolated local test databases.
- Normal authenticated local admin: both grids; staff search/empty/reset; customer overview, profile policies, activity and reason-disabled suspension; staff permission search, roles read view and self-status protection.
- Temporary account text was typed and discarded without save; the server name remained unchanged. Profile policy editor opened/cancelled with section switching blocked. No account, profile, permission, invitation, recovery or status mutation during browser checks.
- Both grids, customer profile detail and open staff permission editor at 320, 390, 768 and 1440px: no horizontal page overflow. Browser warning/error logs empty for the reviewed flow.
- Cursor UI and query contract retained; local directories have four records each, so browser Load more cannot be exercised on that fixture. API cursor/filter regression passes.

Hosted verification is recorded in people-preview-release.json after rollout. Screenshots in evidence/people-visual/.

## Hosted release verification

Admin 4ecddf9 / dpl_8AxyC5oWMDUEUFveXE6Z8vA2xdRa READY, API 2508396 / dep-dbhoetegekts73bqkmg0 live. Stable admin preview is updated. Normal preview administrator session used. Customer status filter/empty/reset, Gold household five stored/five allowed profiles, protected main category and unchanged Save disabled, immutable customer email, and staff catalog search all passed. Profile and open staff permission editor at all four widths have no page overflow; browser warnings/errors empty. API and proxy health 200; unauthenticated customer directory and staff catalog 401. No hosted data writes. See people-preview-release.json.
