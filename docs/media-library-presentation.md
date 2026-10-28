# Media Library visual review

28 October 2026. Deployed to the existing disposable preview. See ../../api/docs/media-library-presentation.md for API/security scope and validation.

The library and entity picker use the same thumbnail grid, accessible icon controls, filters and cursor pagination. A dedicated detail view holds private review, metadata, saved connections and captions. Existing upload, draft attachment and permission checks are retained.

TypeScript and build passed. Authenticated grid/detail/picker checks passed after normal owner sign-in: images, real audio/video review, captions, filters, empty recovery, cursor pages, saved-reference pagination, history, refresh and deep-link reload. Grid/detail/picker containment passed at 320/390/768/1280px. A referrer-policy fix preserves required staff application-origin verification; thumbnails now load. Picker selection was discarded without saving any entity changes. Hosted deployment and signed-in acceptance completed; see the API handoff for exact commits, deployment IDs and coverage. DRM and production email remain pending; stop before the next enhancement.
