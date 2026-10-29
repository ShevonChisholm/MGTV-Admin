# Categories & Discovery admin visual review

29 October 2026. Scope: admin presentation and existing content-selection workflows. Homepage visuals are included in the planned combined preview release.

## Changes

- Icon-led taxonomy grid for Categories, Genres, Tags, protected Age Ratings, Regions and Languages. Cards show real published-reference counts, display order, status and category content-type chips; counts are explicitly before availability/profile checks.
- Saved overview, focused details editor and reasoned activity timeline, with existing version/idempotency/permission checks preserved. Age codes and classification activation remain protected.
- Artwork-based genre/tag assignment picker, 100-reference limit feedback, selection shelf, search, cursor pagination and duplicate-row protection. Artist names resolve correctly. Podcasts now points to its existing admin endpoint and uses the correct cursor parameter.
- Shared show → season → episode selector uses existing hierarchy endpoints in Discovery and Homepage. The former top-level episode-list request did not exist. Show pagination/search and per-season episode filtering preserve explicit selection and source availability rules; no new backend endpoint was added.
- Existing MGTV charcoal/gold treatment, asymmetric corners, icon facts, stable card artwork/fallbacks and card loading scaffold. Search has a clear/reset control. No dependencies, migrations, permission grants, uploads or customer-app changes.

## Local verification

TypeScript noEmit and Vite production build passed; the existing large-chunk advisory remains. Browser checks covered all six taxonomy types, saved detail/edit/activity, search/reset, required-reason save disabling, cancelled create, protected age code/status, assignment selection/removal/cancel, movie pagination from 24 to 48 unique artwork cards, and all twelve assignment content types with no blank titles. Podcast covers loaded 10/10. Episode hierarchy loaded two Kingston Stories season-one episodes, preserved selection through filtering, and worked in both Discovery and Homepage. The temporary Homepage episode selection was discarded without saving.

Category grid, rating editor, category creation form, association picker and episode selector were measured at 320/390/768/1440px with no horizontal page or dialog overflow. Final local browser errors/warnings were empty.

One real local association save retained the existing six Staff Pick targets unchanged and advanced its version to 3. The audit reason was verified in Activity. No semantic content/publication change was made; no records were created. Hosted acceptance will use read-only views and cancelled dialogs.

## Boundaries

This is not a backend integration-suite rerun or an exhaustive accessibility audit. Existing category DTO accepts at most eleven included content types, while the catalog now has twelve; an all-types category remains an existing contract follow-up rather than a schema change in this visual increment. Homepage curation still lacks Podcasts as a supported content kind. These are separate from the completed visual pass.

DRM and production email remain pending. Stop before Notifications or another admin area. Deployment IDs and hosted acceptance are recorded separately after rollout.
