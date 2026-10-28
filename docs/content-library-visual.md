# Content Library visual workspace

28 October 2026. Implemented and verified locally; the stable preview has not been updated.

## Scope

Content Library lists for Shows, Movies, Music Videos, Audio Tracks and Sports now use real private artwork grids, status badges, format icons, concise metadata and explicit loaded-record counts. Movie posters keep a portrait aspect ratio. The navigation lists implemented Content Library types; News/Articles and Events retain their separate admin sections. Artists/Albums/Playlists and every other admin area are unchanged.

Saved records open in an artwork-led Overview with the saved synopsis, artwork pair, selected attachments, audience/rights fields and publication snapshot. Overview, Edit draft and Review & publish are separate views. The original editor and publication controls remain mounted with their existing permissions, version checks, idempotency keys, reasons, preparation, scheduling, archive/restore and upload handlers. Hiding panels uses a scoped hidden rule so inputs do not remain visible because of inline layout styles. Changing panels retains unsaved fields. Overview consistently uses the saved record and identifies unsaved edits separately. Selected media is not labelled processed/verified; publication validation remains authoritative.

Show seasons and season episodes use matching linked cards, retain their nested paths and fixed numbers, and expose child creation only with the existing shows.write grant. A season’s access summary identifies parent inheritance. Missing/unavailable artwork has a genuine icon fallback; it does not borrow sample artwork. Private artwork requests retain the same-origin referrer required by staff session isolation. No backend endpoint, schema, role/permission grant or provider configuration changed.

## Workflow corrections discovered during review

- Shows returns flat taxonomy reference data. The shared editor now normalizes it into the grouped genre/classification lists expected by its fields. This fixes a rendering failure observed in the initial browser pass; subsequent full format/hierarchy checks completed.
- Each format has a distinct editor identity. Switching Movies/Audio/Music Videos can no longer retain the preceding format’s records.
- Load-more requests retain the applied query/status and musicKind rather than an unapplied text value or omitted format.
- New Shows do not request sponsor links before a record ID exists.
- The duplicate Sports route branch was removed.

## Verification

- Final TypeScript and Vite production build passed. The existing bundle-size warning remains; no dependency was added.
- Authenticated local normal-database browser checks passed after owner MFA: all five content types and their saved detail screens; Show → Season → Episode; direct episode deep-link reload; new-Show form without saving; private artwork loading; and movie cursor pagination from 24 to 48 unique records.
- Empty search and recovery passed. The final Movies → Audio → Music Video → Sports switching sequence showed the correct data types and details.
- An existing title was changed only in the browser. Switching Overview/Edit/Review retained the unsaved value, kept the Overview title at its saved value and disabled Publish saved revision. Navigation prompted for discard. Discard completed and the saved original title was verified on reopening. No draft was saved, published, archived or scheduled; no upload was started.
- Representative 320/390/768/1280px grid/detail checks passed. Narrow Sports edit and publication views, episode deep links and the new-Show form remained contained; movie grid/type navigation had no horizontal overflow.
- Error logs retained the original pre-fix taxonomy map failure. No subsequent render exception appeared during the final build’s acceptance sequence.
- React review: primitive hook dependencies, lazy bounded-page artwork, no new per-card API fetch, genuine missing-art fallbacks, accessible link/button names, status text plus icons, keyboard focus indicators, reduced-motion-safe skeletons and mounted editor state.

## Remaining boundaries

This pass did not submit publication, archive, schedule or actual upload mutations, or sign in as a separate read-only staff account. Their existing server enforcement and handlers are retained; the UI permission conditions were reviewed. The prior fixed localhost customer-page link in the publication panel remains an existing environment-configuration follow-up, not an expanded part of this visual increment. Exhaustive keyboard/assistive-technology acceptance and measured CLS remain release QA.

The API, customer app and stable hosted preview are unchanged. DRM and production email remain pending. Stop before another admin area.
