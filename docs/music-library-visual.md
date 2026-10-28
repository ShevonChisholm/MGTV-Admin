# Artists, Albums & Playlists admin visual workspace

28 October 2026. Implemented, checked locally and deployed to the stable disposable admin preview.

## Scope and presentation

The music-library section now uses separate visual grids for Artists, Albums and Playlists. Artist portraits are circular, album covers stay square and playlist covers have a layered stack treatment. Existing private saved-cover endpoints supply actual artwork; unavailable images show an honest icon fallback. A compact search/create toolbar, status badges, linked-release counts and loaded-record counts replace the dense text table. Lists request 24 records per page. Load more keeps the applied search, even when the text field has an unsubmitted edit.

Saved records open in an artwork-led Overview with biography/description, origin/genre, album artist/year or playlist format, saved publication snapshot and ordered thumbnail rows. Album artist links open the existing artist detail route. Linked tracks and music videos link to their existing Content Library detail screens. Overview, Edit draft and Review & publish are separate views. The editor remains mounted while hidden, preserving unsaved field values, attachment selection and ordering. Overview and publication review consistently use the saved record; an unsaved label explains the distinction.

Release ordering uses compact up/down/remove icon controls with accessible names. Empty collections, empty search, loading skeletons and unavailable-record recovery are explicit. Activity history is a compact icon timeline. The shared Media Library picker and upload controls remain the attachment workflow.

## Preserved behavior

Existing draft/create requests, version preconditions, idempotency keys, dirty navigation guard, publication/archive/restore decisions, required reasons and upload handlers are retained. Publishing remains disabled with unsaved edits, insufficient explicit permission or an archived record. Artist/album/playlist permissions are separate; no role-derived permission or account grant was added. Music and artist lookups are requested only with their corresponding read grants. Without those grants the record can still display its own saved overview, preserving linked IDs and explaining unavailable relationship details rather than claiming releases were deleted. Music playback and customer UI are unchanged.

No backend endpoint, database schema, source artwork, catalog record or provider configuration changed. No dependencies were added. Private image requests retain same-origin referrers. Artwork is lazy-loaded in the bounded grid; grid cards do not request individual JSON records. Independent detail reference lists load concurrently. Existing music/artist reference selectors still load their paginated catalogs; redesigning their data volume is outside this visual increment.

## Local verification

- Final TypeScript and production build passed. Existing bundle-size warnings remain.
- Authenticated normal local staff session at 5594: 14 artists, 13 albums and 15 playlists; real private artwork; saved artist detail with six ordered releases; album artist and three-track order; audio/video playlist identity and dedicated editor.
- All fourteen artist portraits loaded. Representative album overview loaded cover and three track thumbnails. Final artist overview loaded seven images.
- Temporary artist title and order edits survived Overview/Edit/Review switching. Overview retained the saved title/order; Publish stayed disabled while dirty. Original values were restored without saving.
- Media picker: 24 ready files, image filtering, 320px containment, temporary artwork selection, Keep editing and Discard navigation behavior. Discard returned to the saved record without saving an attachment.
- Publication reason dialog opened with Confirm disabled while blank; cancelled without submitting.
- Empty album search and Clear search recovery passed. Album-to-artist link, direct detail refresh and browser-history navigation checked. New Artist, Album and Playlist forms opened at 320px without saving.
- Representative grid/overview/edit containment at 320/390/768/1280 or 1440px; document widths stayed within viewport. Picker/publication dialogs fit at 320px. Reorder rows stayed within the narrow workspace.
- Browser error log was empty in the acceptance sequence.
- React review: stable route identity keys, unconditional hooks, image-error state reset per source, functional draft updates, mounted hidden editor panels, accessible icon labels and focus indicators, status text plus icons, static stack transforms and reduced-motion-safe styling.

## Boundaries

No create/save/publish/archive/restore/upload mutation was submitted. No separate read-only staff browser session was provisioned; permission conditions were inspected in source and existing server policies remain authoritative. The dataset did not exceed one list page, so live cursor continuation was not exercised; query/cursor propagation was reviewed. Missing-art fallback, unavailable-record guard and stale-version handling were reviewed in code but not forced through a failing backend during browser acceptance. Exhaustive assistive-technology and measured CLS acceptance remain release QA.

DRM and production email remain pending. Stop before Events. Preview rollout is complete; no next area started.


## Preview rollout

Admin commit d672a8088b251766545a35c83839299fab3474ee deployed READY as dpl_DRN9UPkLr1SDNZVnhcPfqSBkZVuE at https://mgtv-admin.vercel.app. Stable alias and exact source SHA verified. Previous rollback: f748d25156ca8b5dfcb578e507c7f1793d13b969 / dpl_4BkbrrRc9ttkk8HdKnefFXfbBxh8. Vercel calls this stable disposable-preview address its Production target; business production remains pending.

Hosted authenticated acceptance used the existing staff MFA session: fourteen artist cards and fourteen loaded private portraits; MGTV Studio Sessions overview with six linked releases and seven loaded images; Edit draft and Review views; album grid, Island Sketches cover/three thumbnails and saved artist/track order; album-to-artist navigation; fifteen stacked playlist cards with fifteen loaded covers; The Screening Room video-playlist overview, three release rows, direct reload and editor. Playlist grid contained at 320/390/768/1440px (document widths 310/380/758/1430px). At 320px, the video-playlist editor's three reorder rows fit without overflow. Browser error log was empty. No record, media attachment, publication, permission or provider setting was changed. API and customer frontend remain unchanged. DRM and production email remain pending; stopped before Events.
