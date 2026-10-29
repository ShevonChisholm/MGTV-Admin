# Lifestyle & Culture — admin visual improvements

29 October 2026. Deployed and verified at https://mgtv-admin.vercel.app/admin/lifestyle. Admin commit 32e10e5edb1632e92ad1615f924f269e8640af1c; Vercel dpl_DZ8AfJj59RfjsgAuv6TdA1RiZLQC, READY. News has already deployed as 59ce0b0 / dpl_4La3hh6hJwvMq6awy4G7ckr7HVMi.

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


## Hosted acceptance
Stable alias and exact Git commit verified. Existing preview staff session opened eleven story cards; visible cover images loaded. Travel filtered to two stories and Clear restored the full library. Saved reading detail, five-option category editor and reason-required publication dialog passed; confirmation was disabled without a reason and the dialog was cancelled. Hosted grid and editor fit 320/390/768/1440px without page overflow. Checked browser error/warning logs were empty. The admin health proxy returned 200/ok/preview/postgresql; cookie-free Lifestyle management returned 401. No hosted content or access change was made. Previous News deployment dpl_4La3hh6hJwvMq6awy4G7ckr7HVMi is the application rollback target; no database migration was part of this release.
