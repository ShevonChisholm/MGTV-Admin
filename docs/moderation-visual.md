# Moderation admin visual review

29 October 2026. Local and hosted verification completed. Combined admin preview release 925b809 / dpl_AEX5nakwoXvmuZ9zsCj857t4mVkr includes the prior Notifications pass.

## Changes

Visual queue cards show report type, captured title/note, priority, real reports-on-item count, received date and outcome. Queue totals come from the existing summary API. Server-side search/type/priority filters, clear/reset and cursor paging retain the applied filter scope.

Reports now have a current-artwork header and separate Evidence, Report details, Related reports and Activity views. Current artwork is contextual, explicitly distinct from the immutable report snapshot, and loads only when the staff member has the underlying content-read permission. Comment evidence uses a dedicated illustration and keeps captured/current text distinct. Existing adult-only discussion controls remain connected.

Approve, dismiss, remove, reopen and priority actions retain their distinct effects, required reason, report version, target concurrency token and server permissions. The confirmation identifies the exact report, priority and visibility. Podcasts uses its existing read/unpublish permission names and linked management route. No moderation policy or automatic permission grant changed.

Staff report creation now uses a searchable, paginated artwork picker with one selected target, a visible selected title, Podcasts support and the existing show/season episode selector. Comments retain their existing ID entry flow. It no longer loads the entire catalog eagerly. Verification corrected Events paging to cursor (Podcasts uses after), including the same existing Discovery picker adapter.

No API, schema, seed, customer application, provider, dependencies or permission grants changed. No media generation/upload or cloud encoding was used.

## Local verification

- TypeScript noEmit and Vite production build passed; existing large-chunk advisory remains.
- Real open/resolved queues, movie filter (3 results), clear/reset, event artwork, all focused report panes, related-report links and actual activity reviewed.
- Approve/dismiss/remove and resolved-comment reopen confirmations were checked without executing decisions. Required-reason controls remained disabled. Comment reopen explicitly states that it does not restore a removed comment; conversation controls were viewed without changing them.
- Existing local event report 5d7e2bad-bfa1-446b-bce9-fa9badf565d5 priority was changed medium → high → medium with explicit audit reasons. Report version advanced 1 → 3; it remains open, event remains published, queue totals remain 7 open / 4 resolved. Only two local priority audit entries added.
- Staff picker movies paged 24 → 48 unique cards, preserved one selection, Podcasts loaded 10 series, episode selector loaded two Kingston Stories season-one episodes, and Events paged 24 → 32. No staff report was created. Discovery Events paging also reached 32 without errors; selections cancelled.
- Queue, evidence, removal confirmation and staff-report picker measured at 320/390/768/1440px with no page/dialog horizontal overflow. Final browser errors/warnings empty.
- Local health 200; cookie-free Moderation and Notifications management requests 401. No staff authentication bypass.

Screenshots: docs/evidence/moderation-visual. Notifications verification remains in notifications-visual.md. No report was approved, dismissed, removed, reopened or created. No content was unpublished, restored or deleted. This visual pass did not rerun the entire backend decision/concurrency suite or perform an exhaustive screen-reader audit.

## Release boundary

Notifications and Moderation are deployed to the existing disposable admin preview and verified through normal staff authentication without hosted data mutations. See notifications-moderation-preview-release.json. DRM and production email remain pending. Stop before Customers & Profiles.
