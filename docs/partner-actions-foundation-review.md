# Secure partner actions — first increment

30 October 2026. Implemented and verified locally. Not deployed.

## What works

Staff with explicit partnerships.read and partnerships.manage can create a request against an approved, accepted or active agreement. An active partner and a saved contact email are required. Draft terms cannot be sent. Supported tasks are agreement review and requested information.

Staff generates a private link, copies it and shares it with the saved partner contact. No email invitation is sent. Raw links appear once in the response and browser component; they are not stored in task history, audit or idempotency records. Replacing a link invalidates the previous token and all its partner sessions. A lost link must be replaced, not recovered from storage.

The partner opens /partner/action#token=… on the customer web origin. The standalone branded page strips the fragment, shows no private terms before verification, and does not require or create a customer account, customer profile, subscription or staff identity. Partner API calls omit staff/customer cookies and use separate bearer sessions held only in memory. Opening another link in the same tab resets the previous private state.

The API sends a six-digit code to the saved contact through a dedicated local-only partner inbox and template. The client cannot choose a destination address. Codes last 10 minutes, allow five guesses and are consumed after successful verification. Resend waits 60 seconds; there are 20 sends maximum per task plus shared IP rate limits. Wrong attempts commit before returning an error. The code digest includes the high-entropy link secret, which is not stored raw in PostgreSQL.

A successful verification creates a separate partner session lasting at most 15 minutes and no longer than the task. Links default to 48 hours in the admin form, accept 1–168 hours, and are bounded by the agreement end date. Revocation, rotation, changed agreement revision/status, expired agreement term or changed/inactive partner contact denies subsequent access. The page clears private state after the session timeout; Close private view deletes the server session.

The partner sees a deliberately projected snapshot: agreement name/version, partner name, services, scope/benefit/exclusions, territories, responsibilities and commercial terms. It excludes internal histories, source identifiers, staff identities, other partners and unrelated catalog/media records.

A review response can acknowledge review or request changes; an information task accepts supplied information. Submission is retry-safe. Staff may mark the response reviewed or revoke the request with an audited reason. Neither partner submission nor staff completion signs, accepts, activates or pays for the agreement, publishes content or grants permissions.

## Storage and module layout

NestJS implementation lives under src/modules/partnerships/actions with separate controllers, DTOs, service, repository and mail adapter. It uses the existing Access and Auth origin/rate-limit services; existing staff/customer authentication behavior is unchanged.

Migration 068 adds partnership_tasks, partnership_task_sessions and immutable partnership_task_events, with indexes on agreement, task/session and history lookups. Task definitions are immutable at the database layer. No existing migration was edited. Staff writes use existing session/CSRF protections, permissions and optimistic versions. Task creation and responses use idempotency; secret link issuance deliberately does not store a replayable raw-secret response. Concurrency is serialized with the existing short partnership transaction lock; email filesystem delivery occurs outside the transaction.

Code delivery is organized in src/email/templates/partners.ts and the partner mail adapter. Files go to STORAGE_DIR/partner-inbox with private file mode and contain the development email payload. This is local delivery even if a different Auth email transport is configured. Do not deploy this as production email.

## Local acceptance

- API TypeScript build passed.
- 28 tests passed across Partnerships/security/commercial-boundary and email-template suites. Includes anonymous/staff/CSRF/DTO boundaries, reviewed-state gating, OTP lockout, replay/rotation, expiry, contact/revision invalidation, response idempotency, revocation, explicit session closure and immutable task definitions. Existing customer plan/commercial safeguards remained green.
- Both frontend TypeScript checks and production builds passed. Existing large-bundle warnings remain; no dependencies added.
- Customer startup-gate and route-contract checks passed. React review covered effect cleanup, private-state reset, permission guards, draft protection and stale results.
- Normal local staff session verified the draft agreement panel, empty state and disabled creation before review. No normal agreement or staff access was changed.
- A separately created synthetic PostgreSQL database exercised the real partner browser flow: open link, request code, verify through the normal form, view terms, submit a change request and close private access. The agreement remained approved at version 3; the closed task had zero server sessions. Missing-link and same-tab reset behavior were checked.
- Partner review and normal admin agreement page each fit 320/390/768/1440px: eight measured page-width checks, no horizontal page overflow. Captured browser warning/error lists were empty. Viewport override reset.
- The new staff task creation, rotation, revocation and completion controls have API integration coverage. Full browser acceptance of those controls on a reviewed agreement remains before preview release; the normal development agreements are drafts, and their review policy was not bypassed. A synthetic MFA-enabled staff fixture was prepared only in the isolated database; it was not used to replace the normal local browser session.
- The normal local database was backed up before applying migration 068. Archive .data/backups/pre-partner-actions-1793380300851.dump passed pg_restore --list; SHA-256 ba2accf54008da36d1843bd74819bf4c4a0a929ef0f30e7f242338ac4cb50f47. Existing agreements, memberships, identities and permissions were preserved.
- Existing review servers were left running. Separate local review ports were used after automatic review rejected stopping them as potentially disruptive. Synthetic browser fixtures are isolated from normal and hosted preview accounts.

Evidence: partner-action-review-desktop.png, partner-action-review-mobile.png and partner-actions-admin-desktop.png in the Codex visualization folder for 22 October 2026. No real partner links, codes or credentials belong in committed screenshots or documentation.

## Remaining increments and decisions

1. Finish reviewed-agreement staff browser acceptance, then prepare a coordinated API migration/admin/customer preview release with a preview backup and hosted checks. Nothing in this increment has been deployed yet.
2. Decide the signing approach. A dedicated provider is recommended in the pending owner question; no provider was selected or enabled. Signing needs a frozen document and digest, authorized signatory details, provider ceremony and verified completion evidence. Task acknowledgement remains distinct.
3. Add partner media submissions, each scoped to a specific agreement deliverable, content entity and allowed media purpose. Reuse resumable Mux/R2 uploads without exposing the general Media Library or publishing controls. Staff review must remain required; free-tier capacity must be checked before cloud jobs.
4. Define partner payment obligations before Stripe integration: direction, fixed amount/currency, tax, due dates, full payment versus deposits/installments, expiry, refund/dispute policy and financial authority. Derive a checkout from an immutable obligation. Verify through a dedicated partner webhook and reconcile provider records; a return URL never proves payment. Incoming collection, licensing payables and revenue-share settlement remain separate.
5. Define attribution, deductions, statements and beneficiary/payout onboarding before implementing revenue shares or MGTV-to-partner payments. A Shop product relationship alone does not allocate proceeds.
6. Before production rollout, complete delivery adapter/outbox/retries, retention/cleanup for expired partner sessions and local inboxes, host/proxy rate-limit acceptance, and the deployment/security review. The current standalone action page is a development foundation, not a partner portal.

Production email and DRM remain pending. No signing, external email, payment, payout, cloud media job or next module was started.
