# Podcasts — local implementation and verification

29 October 2026. Local implementation; not deployed to the hosted preview.

## Scope
Audio and video episodes belong to podcast series, with optional season numbers. Podcasts appears under More on the customer site and has a dedicated visual management workspace in admin. Existing MGTV styling, player controls, staff MFA, customer sessions and profile authorization remain in use.

## Backend and data
The NestJS podcasts folder contains controller, DTO, model, service, repository and contract files. Migrations 061–063 add immutable draft revisions, publication pointers, retained media references, profile progress, resource permissions, discussion/report targets and Discovery indexing. Saved revisions and published revisions remain separate. Strong versions prevent stale saves; create and lifecycle actions use idempotency keys. Episode numbering is unique within a series/season. Parent withdrawal hides its episodes; incompatible format changes are rejected.

The four explicit permissions are podcasts.read, podcasts.write, podcasts.publish and podcasts.unpublish. Publication permissions are direct grants, never implied by a role name. The approved grant was applied only to the normal local administrator, audited, and existing staff sessions revoked. No hosted administrator grant has been made.

Publication validates rights, ready cover/full media, format, duration, separate shorter preview and short featured video. Original video branding follows the existing review policy. Historical references prevent media deletion.

## Customer access and playback
Guests may browse published eligible records and play available previews. Full playback requires a signed-in customer and selected profile; series and episode classification, territory, availability and subscription requirements are checked server-side. Video uses existing secure 15-second viewing authorization windows and quality caps. Audio does not consume the video viewing budget. Resume progress belongs to the selected profile and media version; completed, replaced or inaccessible media is excluded. No fictional viewing history is seeded.

The customer player includes audio progress, seeking, skip, speed and volume controls, branded video playback, compact episode recommendations, sharing, adult-only discussions and reporting. Video preview completion uses the shared MGTV gate; audio uses its poster-backed sign-in prompt. Profile changes clear the source and isolate pending progress saves. Podcasts also participates in global search, Discovery curation and catalog moderation.

## Admin workflow
Artwork grid → saved detail → episode grid/history → draft details → media attachment → reasoned publication. New series/episodes save their record before attachment. Media upload/read privileges remain separate from Podcasts privileges. Search/status filters, cursor pagination, archived records, restore, explicit reasons, unsaved-change protection and upload busy guards are included. New-episode prefills establish a clean baseline; obsolete list responses cannot replace newer filters.

## Seed
Run seed:podcasts only with the guarded local development configuration and --approved-local-development. Ten fictional series and twenty episodes were created using existing local artwork and short audio/video samples. Rerun preserved all thirty records. No new Mux/R2 asset, cloud job or paid service was used. These are development examples, not claims about real podcast recordings.

## Verification
211 distinct integration checks passed across Auth (18), existing publishing workflows (172), Access (10) and Podcasts (11). Podcasts covers permissions, immutable revisions, stale writes, publication/media validation, optional seasons/numbering, parent restrictions, guest/full access, premium inheritance, progress isolation, video budgets, search, adult comments/reporting, shared locks and concurrent numbering. API TypeScript and both frontend TypeScript/production builds passed. Existing frontend large-chunk warnings remain.

Guest browser review confirmed ten rendered artwork cards, More → Podcasts, ordered series episodes, audio/video preview playback, end-of-preview sign-in gates and no horizontal page overflow at 320/390/768/1440 pixels on landing, series, audio and video episode pages. Authenticated admin browser checks passed for artwork grid, detail, episode links, draft fields, media picker, reason-required publication review (cancelled without mutation), search and unsaved-change discard. Grid, detail and new-episode forms have no page overflow at 320/390/768/1440. Checked browser consoles contain no errors. Signed-in customer browser acceptance remains pending; access/progress paths are covered by integration tests. No seeded content was altered during browser review.

## Follow-ups outside this increment
Hosted deployment, preview migrations/seed and any preview permission grants require their own rollout. External RSS/import/distribution, follows, automatic podcast lifecycle notifications, Homepage editorial placement, podcast ad-campaign targeting and analytics playback sessions, bespoke podcast artwork, and a persistent cross-route podcast mini-player/queue are not included. Existing profile resume is implemented. DRM and production email remain pending. Stop before the next admin area.
