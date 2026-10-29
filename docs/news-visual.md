# News & Articles — admin visual improvements

29 October 2026. Deployed as admin commit 59ce0b0b9eca7ca4452e6f683ee2dc248a4e54e4, Vercel dpl_4La3hh6hJwvMq6awy4G7ckr7HVMi, READY at https://mgtv-admin.vercel.app. API/customer behavior remains unchanged. This increment follows the completed Podcasts preview rollout and stops before Lifestyle & Culture.

## Presentation
An artwork-led grid replaces the text list. Cards show actual saved cover, category, status, headline, summary, byline and calculated reading time. The toolbar retains server search/status filters and cursor load-more; the loaded count is labelled accurately rather than presented as the database total. Clear resets applied filters. Pagination retains the submitted filters even if a new unsubmitted search is typed; obsolete responses are ignored and duplicate IDs are excluded.

Saved detail now has a visual overview, readable article preview and icon-led sections for Saved story, Edit draft, Artwork, Review & publish and Activity. The editor separates story details from paragraph/heading/quote blocks. Reordering, deletion and text limits retain the existing data contract. Reading-time and word counts are derived from the actual body, not engagement analytics. Artwork selection remains separate from saving; a replacement is labelled Save to preview this cover until the draft is saved. No staff-facing provider/implementation details were added.

## Workflow and security preservation
The existing News API, strong versions, idempotent creation/actions, explicit news/media permissions, CSRF and reasoned lifecycle actions are retained. Unsaved draft text never replaces the saved reading view. Saving remains separate from publication. Dirty drafts disable lifecycle actions; archived editing remains read-only; restore never republishes. Media-upload busy state is separate from request busy state and protects navigation. Existing file uploads and the visual library picker remain available. All preview rendering is React text, without injected HTML. Image failures have stable visual fallbacks; reduced motion and keyboard focus are respected.

## Verification
Admin TypeScript and production builds passed; existing large-bundle advisory remains. Authenticated local browser review covered real artwork, list/detail, search/clear, draft-only and empty results, unsaved reading preview vs saved-story isolation, block reorder/discard, dirty navigation/Keep editing, replacement-cover/discard, media picker, activity and reason-required publication dialog (cancelled). No article revision/publication or media upload was committed during review. Grid, detail, details editor, article body and artwork fit actual 320/390/768/1440 viewports; measured editor fields do not overflow. Production API workflows were not modified. New-draft defaults and four-width containment passed. The new record correctly says Not created yet and explains that artwork is attached after creation. Final browser error and warning logs were empty. New image normalization/upload and broader assistive-technology acceptance were not re-run; the existing uploader/API is retained. No full API regression rerun was necessary for this presentation-only News change.

## Next
Hosted staff review passed for artwork grid, saved article reading view and reason-required publication confirmation, cancelled without mutation; browser errors empty. Next visual area: Lifestyle & Culture. Keep other admin visual areas queued in docs/admin-visual-roadmap.md. DRM and production email remain pending.


Lifestyle follow-up: both modules now reuse EditorialWorkspace with an explicitly typed resource. News keeps its own permission keys, artwork routes and free-text category, while Lifestyle keeps its five category values. Local News list/detail/editor regression checks passed after extraction. The backend contract is unchanged.
