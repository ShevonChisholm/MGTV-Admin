# Notifications admin visual review

Completed and deployed to the disposable preview on 29 October 2026, together with Moderation as 925b809 / dpl_AEX5nakwoXvmuZ9zsCj857t4mVkr. This includes the earlier Homepage & Discovery release.

## Changes

- Icon-led message/template/history cards with category, lifecycle marker, real status, audience, channel chips and saved/scheduled dates.
- Search, category/status filters and explicit loaded-record counts. Filters apply to records already fetched in the current tab, not a server-wide total; Load more retains real cursor pagination and excludes duplicate IDs.
- Separate saved overview, focused three-step composer (Message → Audience & channels → Review), and real activity timeline. Saved overview and delivery confirmations use saved data; unsaved composition has its own labelled preview. Send/schedule/test/cancel remain disabled while dirty, and only explicit permissions expose delivery actions.
- Branded in-app/email layout illustrations, selected-audience estimate with optional segment comparison, and real per-channel outcomes. System-category audience estimates are labelled, overlapping segments are not added together, email stays local and no email-open rate is invented. Message sent status is distinguished from successful delivery outcomes.
- Save and test-preview now refresh the full record so audit history and delivery metadata remain current. Read-only lifecycle destinations are displayed intact. Historical records return to History; scheduled/draft records return to Messages.
- Lifecycle configuration is separated behind a disclosure, with icon-led milestone groups, real recorded counts and expandable eligibility policy. Existing settings, 48-hour Gold event first-look policy, explicit permissions and reasoned saves are preserved.

No API, database/schema, customer application, permission, email-provider configuration or dependencies changed. No artwork was generated or uploaded; notification categories use meaningful icons and the approved logo.

## Verification

- TypeScript noEmit and Vite production build passed. Existing large-chunk advisory remains.
- Local authenticated browser reviewed message/template/history views; template category/search/clear/empty and archived filters; real message cursor pagination; history pagination from 29 to 59 unique cards; saved overview and channel illustrations; all three composer steps; channel-less Save disabling; unsaved navigation Keep editing/Discard protection; and read-only delivery history with actual server metrics.
- Tested 120-character unbroken titles and 400-character bodies. Saved overview, composer/audience step, review step, long entity-destination outcome view, schedule confirmation, history grid and open lifecycle panel contained at 320/390/768/1440px with no horizontal page/dialog overflow.
- Reason-required Send, Schedule, Cancel and Archive confirmations opened and were closed without execution. No send, schedule, cancel or archive command was issued. No template-copy draft was created.
- A real saved-message test preview executed locally, recorded its audit reason and returned the server notice that no audience deliveries were created. No audience notification or email was delivered by this test.
- Existing local draft 95648f3f-551b-46c6-9086-35064a863c59 was temporarily renamed and restored in two save/restore cycles (the second verifies the audit-refresh correction). Version advanced 1 → 5; original title/body/audience/channels/destination remain intact. Four local update audit entries were added. No new message record was created. Temporary new-composer text was discarded.
- Automation settings were viewed only; no toggle or save changed them. Local review process continues to have background/provider jobs disabled.
- Final browser errors/warnings empty. Local health 200; cookie-free notification/audience management requests 401.

Screenshots in docs/evidence/notifications-visual. The composer screenshot contains temporary unsaved review text, subsequently discarded. This is a presentation pass with real browser/API checks, not a backend delivery-suite rerun, production-email acceptance or exhaustive screen-reader audit.

## Next

Hosted acceptance passed; see notifications-moderation-preview-release.json. Stop before Customers & Profiles. DRM, production email/domain/inbox and browser-push setup remain pending. Broader notification-category/destination expansion is separate from this visual pass.


Hosted checks used normal staff authentication and cancelled dialogs. Temporary composer text was discarded; no hosted draft or audience delivery was created. Template/category filtering, channel-less save gate, three steps, unsaved navigation and real history outcomes passed. Hosted template grid and composer review contained at 320–1440px; console errors/warnings empty.
