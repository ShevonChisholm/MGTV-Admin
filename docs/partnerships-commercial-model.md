# Partnerships and customer-plan administration

Local verification completed 29 October 2026. API and admin are now deployed to the disposable preview; authenticated hosted acceptance is complete. DRM and production email remain pending.

## Implemented UI

The Partnerships workspace at `/admin/partnerships/agreements` has partner, service catalog and offering directories, server-backed search/status filters, pagination, guided editors, saved quotes, revision history and reasoned workflow dialogs. Agreement steps cover partner, services, relationships, terms and review. Service benefits include eligibility, limits, delivery evidence and explicit operational readiness. Existing permitted entity detail screens expose agreement cross-links.

Customer plan configuration compares provider sandbox prices and benefits. Future-policy edits require a before/after review and audit reason. Existing purchases retain captured benefits. This screen cannot grant memberships or change provider charges. Both workspaces preserve the MGTV staff shell and visual system.

## Verification

- API commercial/billing/profile/access/user suites: 58 passed.
- Admin TypeScript and production build passed; existing large-bundle warning remains.
- Partner creation, inactive status, saved detail navigation, history, search/reset and cancellation passed using a fictional local review record.
- Agreement details/readiness and all five wizard steps reviewed. Saved and newly selected relationships show readable names. Published-only offering lookup excludes draft templates.
- Service definition/pricing/evidence wizard and offering publication reason dialog reviewed; publication cancelled.
- Agreement and Shop product cross-links work in both directions.
- Plan before/after review and required reason verified; temporary edit cancelled. Roots, Rhythm and Gold policies remain unchanged.
- Agreement detail, service wizard, plan table and plan review fit 320/390/768/1440px without horizontal page overflow.
- A stale-section render crash found during navigation was fixed through scoped loading and stale-response guards. Section-switch rechecks passed; final browser console had no errors/warnings.
- No real agreement was approved, accepted or activated and no payment or payout was attempted. The six specifically approved hosted permissions were granted through the audited one-time release hook.

## Access and evidence

Local partnership read/manage/approve/activate grants and the separately approved customer-plan read/manage grants were audited and revoked old sessions. Fresh MFA sign-in was used. The only additional review record is an inactive fictional local partner, with no agreement or benefits. The six preview partnership/customer-plan permissions were separately approved, granted once and audited; previous sessions were revoked.

Screenshots are stored under `docs/evidence/partnerships/`. Architecture, concrete relationship mappings, migration safety and financial execution boundaries are documented in the API repository's `docs/partnerships-commercial-model.md`. Paid partner activation/settlement and automatic benefit delivery remain blocked until their adapters and policies exist.

Hosted admin commit `0e64c19` is READY at https://mgtv-admin.vercel.app, backed by API `40ef9fe`. Encrypted backup and migrations passed; four memberships, one checkout and tier policies were preserved. Hosted browser acceptance is complete after the owner imported the original private preview key into their authenticator. No MFA reset was applied.

## Completed hosted acceptance

The owner successfully used the existing private preview authenticator key; the recovery plan was closed without reset. Hosted partner/service/offering/agreement save checks passed with fictional inactive/planned/draft review records. Revision retrieval, named Shop relationships, read-side product agreement links, before/after plan review and cancellation passed. The plan page/review and revision modal fit 320/390/768/1440px with no horizontal page overflow. Browser console was clean. No tier policy change, agreement approval/activation, payment, payout or MFA reset was performed. API release evidence records the review IDs.
