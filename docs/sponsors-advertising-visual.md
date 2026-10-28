# Sponsors & Advertising admin visual review

28 October 2026. Implemented and reviewed locally at http://127.0.0.1:5594. Not deployed. Stop before Awards & Voting. DRM and production email remain pending.

## Presentation and preserved workflows

Sponsors now use an artwork grid with selected-logo inset, publication/organization status and contextual-credit count. Saved Overview separates the public-facing identity from Organization, private Contacts, visual Brand assets, searchable Shows & events, Activity and Review & publish. Asset tiles distinguish light/dark logos and the selected public logo. Contextual credits link to existing show/event detail routes with private artwork. Existing attachment/upload and publication workflows remain.

Advertising uses creative cards and advertiser initial tiles (no logo field exists; no invented external logos). Saved campaign Overview shows creative, advertiser, objective, destination, dates, placement scope and an image/video gallery. Edit details, Review & status and Activity are distinct views. Placement choices show content thumbnails and title search. Attachments have image tiles or file/video icons. Videos mount only in active preview views; no autoplay. Workflow pills highlight only the current stage. Advertiser Overview shows saved details and linked campaigns; contacts stay in the authorized editor. Reporting replaces the dense table with campaign metric panels and icons, retaining actual counts and the existing client-observation/non-billable disclaimer.

MGTV charcoal/gold, diagonal rounded corners, private lazy images with genuine fallbacks, labeled icons and existing shell remain. No dependencies, permission grants, schema/provider changes or customer UI changes. Existing save/create, strict validation, version/idempotency headers, attachments, dirty navigation guard and reason dialogs remain. Saved Overview never uses unsaved input. Draft values survive pane switches; commands remain blocked while dirty. Completed campaign editing stays disabled. Approval still requires a reviewer separate from creator/latest editor/submitter; activation remains separate. Sponsor publication and organization status remain distinct. Public delivery still uses approved/published revisions.

Applied filters stay separate from unsubmitted search input so cursor continuation remains bound to the applied query. Local fixtures have four sponsors, six campaigns and three advertisers; Load more was source-reviewed but not browser-exercised because these lists do not exceed one page.

## Additive API dependency

Campaign list results now add optional previewCreative for the first ready image referenced by the saved campaign draft. One batched media lookup supplies it; advertiser lists skip the lookup. Existing advertising.read list/asset checks remain. URLs use the same-origin staff asset route, not provider credentials or public storage links. Video-only/not-ready/missing artwork falls back honestly. Hosted artwork metadata requires API deployment before admin rollout. See ../../api/docs/advertising-preview-metadata.md.

## Verification

- Admin TypeScript and Vite production build passed; existing bundle-size warning remains. API TypeScript passed.
- Three new preview tests passed, including real SQL ready-image filtering in a transaction-local TEMP table, rolled back without changing normal media.
- Full publishing integration file: 171 passed, zero failed. Includes Sponsor private/public isolation, explicit grants, publication/deactivation, concurrent writes and cursors; Advertising independent frozen-revision review, activation, media references, tier delivery and observations. Initial filtered invocation failed because it omitted earlier media-fixture scenarios; subsequent complete run passed. The suite creates/cleans its disposable database.
- Existing authorized local MFA session: sponsor grid, Harbour House saved overview, private story/logo images and show/event links, asset gallery, association search (Kingston yielded two targets with loaded images). Unsaved title survived pane changes while saved Overview stayed unchanged; discarded without saving. Deactivate dialog required reason and was cancelled.
- Six campaign image cards; draft edit persisted across panes but Overview retained saved title and Submit stayed disabled while dirty. Restored without saving. Completed campaign editor disabled. In-review campaign exposed authorized review controls; approval dialog required reason and was cancelled. Activity had no mounted video. Local sample video loaded controls/metadata; Reload video preview is a normal control, not itself an error.
- Advertiser saved overview, contact edit pane and linked campaigns reviewed. Campaign search narrowed to one and Clear recovered six. Sponsor empty search and recovery passed.
- Loaded sponsor/campaign grids, sponsor/advertiser details, campaign Edit/Review and sponsor Brand assets fit at 320/390/768/1440px. No page-level horizontal overflow or overflowing campaign field. Five screenshots in docs/evidence/sponsors-advertising/.
- Browser error log empty. No normal local content, media, publication, review, activation, payment or permission mutation submitted.
- React review: unconditional hooks, stable record/list keys, batched metadata instead of per-card JSON, scoped hidden panes, inactive videos unmounted, status text with icons, labeled controls/focus treatment, private images with same-origin referrer/fallbacks and no added motion.

## Boundaries

Hosted acceptance awaits deployment. Separate read-only/reviewer staff browser sessions were not provisioned; server policy regressions passed. Actual workflow mutations were not repeated in the normal database. New-record creation, media upload, forced stale conflicts/provider outages, measured layout shift and exhaustive assistive-technology acceptance were not browser-exercised. Existing provisional campaign artwork stays unchanged for a separate content pass. Awards & Voting not started.
