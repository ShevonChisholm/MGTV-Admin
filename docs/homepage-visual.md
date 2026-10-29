# Homepage & Featured Content admin visual review

Completed locally on 29 October 2026. Not deployed to the hosted preview.

## Presentation

The eight existing page surfaces now have icon navigation, a saved-page canvas, artwork-led hero and section cards, a focused section editor, a visual content picker with a selected-content shelf, saved preview, publication review and activity timeline. Lead artwork loads eagerly; secondary artwork loads lazily with stable frames and explicit fallbacks. Initial loading uses a canvas-shaped skeleton.

The canvas represents the saved draft. Unsaved changes stay in the editor until Save draft. Publication requires a current server review matching the saved revision and version, an explicit reason and confirmation. Withdrawal and restore also retain reasoned confirmation. Personal history and membership sections explain their behavior without fabricating profile data.

Existing API contracts, content restrictions, explicit permissions, version checks and idempotent commands are preserved. No API, customer application, migration, schema, permission or provider changes were made. Existing artwork was reused; no uploads or cloud generation were needed.

## Verification

- TypeScript noEmit and Vite production build passed. The existing large-chunk advisory remains.
- Authenticated local browser checks covered all eight surfaces, hero selection limits, movie cursor pagination (24 to 48 unique rows), event thumbnails, selected-content removal, focused section editing, add/reorder/remove, discard protection, saved preview, activity and cancelled publication/withdrawal/restore confirmations.
- Canvas, picker, hero editor, section editor and saved preview had no horizontal page overflow at 320, 390, 768 and 1440 pixels. Browser errors/warnings were empty on the reviewed paths.
- A real local draft-save cycle changed a temporary section label at version 9. The public homepage structure remained identical to its baseline. Restore published layout to draft produced version 10 with the original label and layout restored; the public structure remained identical again. Two local draft/audit revisions were added; nothing was published. A restored draft can have a distinct revision identifier despite identical content.
- Local API health returned 200; a cookie-free admin Homepage request returned 401. No authentication bypass was used.

The protected baseline is ignored under apps/api/.data/homepage-admin-visual-public-baseline-20261029.json. Screenshots are in docs/evidence/homepage-visual. No credentials are included.

## Boundaries and follow-up

This was a presentation-only pass with real browser workflow checks, not a new backend integration-suite run or exhaustive accessibility audit. Hosted acceptance awaits an authorized preview deployment. The existing Homepage content-type catalog does not include Podcasts; that is a separate integration follow-up. Artwork diversity can improve later without changing the curation workflow. Categories & Discovery has not been started. DRM and production email remain pending.


Combined-release follow-up: episode selection now uses the shared show/season hierarchy selector, verified with Kingston Stories season-one episodes. Temporary selection was discarded. Categories & Discovery visuals have since been completed; see discovery-visual.md. The original local-only status above records its initial checkpoint; deployment evidence is recorded separately after rollout.


Preview rollout complete: commit 6910a5f / dpl_GHS7DgvTRAEB6JaFj9Hk4hP8n9Pm is READY at https://mgtv-admin.vercel.app. See homepage-discovery-preview-release.json for exact hosted checks and rollback reference. No hosted records were saved or published during acceptance. DRM and production email remain pending; stop before Notifications.
