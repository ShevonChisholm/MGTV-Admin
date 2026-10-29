# Partnerships and customer-plan administration

Local verification completed 29 October 2026. No hosted rollout yet. DRM and production email remain pending.

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
- No real agreement was approved, accepted or activated, no payment or payout was attempted, and no hosted permissions were granted.

## Access and evidence

Local partnership read/manage/approve/activate grants and the separately approved customer-plan read/manage grants were audited and revoked old sessions. Fresh MFA sign-in was used. The only additional review record is an inactive fictional local partner, with no agreement or benefits. Preview grants remain separately unapproved.

Screenshots are stored under `docs/evidence/partnerships/`. Architecture, concrete relationship mappings, migration safety and financial execution boundaries are documented in the API repository's `docs/partnerships-commercial-model.md`. Paid partner activation/settlement and automatic benefit delivery remain blocked until their adapters and policies exist.
