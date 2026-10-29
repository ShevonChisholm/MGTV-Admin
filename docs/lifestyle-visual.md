# Lifestyle & Culture — admin visual improvements

29 October 2026. Implementation and local acceptance complete; preview rollout pending this checkpoint. News has already deployed as 59ce0b0 / dpl_4La3hh6hJwvMq6awy4G7ckr7HVMi.

## Presentation
The text list is now an artwork-led story library. Cover cards show saved headline/summary, byline, status and actual reading-time estimates. Icon-led topic filters use the existing server category filter for Food & Cooking, Travel, Fashion, Culture and Wellness; loaded counts are labelled as loaded rather than database totals. Search/status filters, Clear and cursor load-more remain server-backed. Pagination retains applied filters and excludes duplicate IDs; obsolete responses cannot replace newer results.

The saved detail has a strong cover, facts and a reading preview. Edit draft separates details from body blocks; Artwork keeps selected media, alternative text and caption together; Review & publish has a saved-content checklist and the existing reasoned actions; Activity shows actual audit history. Unsaved text and cover selection remain distinct from saved/public content. New drafts explain creation before artwork attachment.

## Architecture and preservation
News and Lifestyle share EditorialWorkspace and the existing visual article components, avoiding duplicated editors. The resource prop is limited to news/lifestyle; each module retains its own routes and explicit permissions. Lifestyle categories remain the five API-approved values; News keeps free-text categories. Existing PATCH/create/action payloads, version checks, idempotency, CSRF, archive/restore semantics and independent Media permissions remain unchanged. No API, schema, customer UI, provider account, price, cloud asset or permission was changed for this visual pass. No new dependencies.

## Verification
Admin TypeScript and production builds passed; the pre-existing large-chunk advisory remains. Authenticated local browser checks passed for grid/artwork, topic filtering/Clear, saved detail, correct Lifestyle cover URLs, category dropdown/default Culture, unsaved preview vs saved view, dirty publication protection, dirty navigation/Keep editing, discard, body reorder/discard, artwork fields, reason-required publication confirmation (cancelled), audit history and fresh-form defaults. Grid, saved detail, details editor, body editor and artwork fit 320/390/768/1440 widths without horizontal page overflow; checked fields do not overflow. Browser error/warning logs were empty. News list/detail/editor and its artwork/category behavior were regression-checked after the shared extraction.

No article revision, publication or media upload was committed during local acceptance. New upload, exhaustive assistive-technology and full API regression suites were not re-run for this presentation-only increment. Existing API behavior is preserved; visual acceptance does not claim completion of unrelated module gaps.

## Stop point
Stop before Homepage & Featured Content. Remaining admin visual queue is docs/admin-visual-roadmap.md. DRM and production email remain pending.
