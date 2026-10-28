# Events & ticketing admin visual workspace

28 October 2026. Implemented and verified locally; stable admin preview not updated.

## Presentation

Events now use artwork-led cards with saved title, timezone-aware date, venue/format, publication badge, event lifecycle and playback-access label. Private landscape/portrait fallback artwork uses existing staff endpoints, lazy loading and same-origin referrers. The search/create toolbar is compact; publication and lifecycle filters open in an overlay dialog and do not reserve a sidebar or resize the grid. Counts explicitly describe loaded records. Cursor paging keeps the applied filters rather than unsubmitted field edits. Initial loading and unavailable-record views remain explicit.

Saved details open in Overview, with campaign artwork, saved description, venue/access facts, timezone-aware planned check-in/start/end timeline, performer initials and broadcast/replay attachments. The timeline does not override eligibility, and does not imply admission for postponed/cancelled events. Edit details uses a responsive form layout. Tickets & admission and Review & operations are separate views. Editor, ticket settings and operations stay mounted while hidden to retain unsaved state. Header save/discard actions appear only in Edit details; Overview continues to show the saved record.

## Tickets & admission

The admission desk shows actual issued/check-in totals and the saved sales setting from the existing ticketing API. An enabled setting is not presented as proof that sales are currently eligible. Configuration and the private-code check-in form have separate visual panels. Ticket products remain fixed after linking. With commerce.read, selected-product detail supplies dated ticket-option cards with JMD price, capacity, sold and currently available counts. Availability is explicitly a snapshot including live checkout reservations; checkout remains authoritative. Capacity refresh is read-only. Without Commerce access, ticket summaries and authorized check-in remain separate from product browsing/configuration.

Settings, reason validation, version preconditions, idempotency, dedicated-product constraints and explicit ticketing.manage/checkin permissions are retained. Check-in still uses the existing opaque-code endpoint and format check; dates, single admission, payment and cancellation rules remain server-enforced. Following a successful check-in, refreshing the summary preserves an unsaved settings draft; a refresh failure is distinguished from failed admission. This increment does not submit payments, issue tickets or change refund policies. Existing Commerce product links remain the route for price/capacity management.

## Preserved event workflows

Existing event create/save, dirty navigation guard, media selection/upload, rights/originals review, publication validation, publish/unpublish, archive/restore, postpone/new-date confirmation, cancel/completion and lifecycle settings remain. Publication, event lifecycle and broadcast status stay distinct. Existing sponsor linkage is retained, not redesigned. Existing mutation endpoints, role/permission grants, database schemas and provider configuration were not changed. No dependency added; API and customer frontend unchanged.

## Verification

- Final TypeScript and Vite production build passed. Existing bundle-size warnings remain.
- Normal authenticated local staff session at 5594: 24-card initial event page, real private artwork, 24→32 unique records with an unsubmitted query ignored during cursor continuation.
- Sunday in the Yard saved overview, planned schedule, venue/performers and real artwork. Kingston After Sunset linked ticket product, two dated options, JMD 4,500 / 2,500 prices and 25 / 100 capacity shown from Commerce. An unlinked event showed disabled sales and no invented ticket capacity.
- Temporary event title edit survived view switches, Overview retained saved title and Publish stayed disabled while dirty; original title restored without saving.
- Temporary ticket toggle/reason retained across views while saved summary stayed Enabled; restored without saving. Leaving with a ticket reason triggered the normal unsaved-change guard; Keep editing retained the draft.
- Postpone dialog kept local timezone date fields, required reason before confirmation, fit at 320px and cancelled without submitting. No lifecycle command was sent.
- Filter overlay combined published + scheduled into fifteen matching records; Clear filters and empty search/recovery passed. New-event form opened at 320px without saving.
- Representative event editor, operations, ticketing panels/options at 320/390/768/1280px remained within viewport; no overflowing editable field or ticket panel found. Filter/postpone dialogs fit at 320px. Real event-grid and overview desktop screenshots captured.
- Invalid admission-code format kept check-in disabled; no real code was entered or redeemed. Browser error log was empty. Final detail reload returned to the saved Overview.
- React review: stable event identity key, unconditional hooks, private lazy artwork with genuine fallbacks, cancellation of stale product-detail reads, functional draft updates, scoped hidden panels, accessible icon names/focus indicators, status text plus icons and reduced-motion-safe styling. Independent ticket settings/product-list reads remain concurrent; capacity detail is fetched only for the selected product with permission, never once per event card.

## Boundaries

No event, ticket settings, media, order or check-in mutation was committed. No new staff permissions were granted. Separate check-in-only/read-only staff browser sessions were not provisioned; their permission branches were reviewed in source. Successful check-in and its post-success summary-refresh error path were not exercised against real tickets; existing server behavior is retained. Private-art failure fallback, backend unavailable-record recovery and stale-version conflicts were reviewed but not forced during this browser sequence. Exhaustive assistive-technology and measured CLS acceptance remain release QA. Source is ready for a separate preview deployment.

DRM and production email remain pending. Stopped before Sponsors & Advertising.
