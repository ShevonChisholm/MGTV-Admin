# Contact & Newsletter admin visual review

29 October 2026. Deployed and hosted-verified at the existing disposable preview. See communications-preview-release.json for the exact release and rollback details.

## Changes

- Three icon-led workspaces: Contact inbox, Subscribers and Newsletters, with MGTV charcoal/gold presentation and a decorative envelope illustration.
- Search is submitted explicitly instead of fetching and resetting the view on every keystroke. Status filters, reset and refresh remain available. Search length matches the existing 100-character API limit.
- Directories use readable tables, status markers, fixture labels, dates in Jamaica time and focused Open actions. The shared table paginates ten loaded records at a time; the existing cursor operation loads another 25. Summaries explicitly describe loaded matching records, not global totals.
- Opening a record replaces the directory with a focused view. Contact details show sender, subject, message, reasoned actions and recorded history. Subscriber details show consent dates/version and suppression safeguards. Staff still cannot confirm subscriptions.
- Newsletter compose fields feed a branded, escaped-text content preview. Eligible audience information, save/review actions, unsaved-input feedback, recorded history and local delivery outcomes remain distinct. The preview explicitly does not claim to be the exact rendered outbound template.
- Existing explicit permissions, idempotency keys, version/conflict checks, dirty guards, fixture send exclusion, local-send confirmation and API operations are retained. Detail headings receive focus; returning to the list focuses search; arrow keys move between tabs. Tab navigation is blocked while a request is busy.
- No new dependencies, API changes, provider configuration, permission grants or production delivery.

## Verification

- Admin TypeScript passed. Vite production build passed (final JS index-6tGi1H13.js); existing bundle-size warning remains.
- Existing Contact & Newsletter integration suite: 11 passed, 0 failed, isolated temporary local database. Includes double opt-in, explicit read/manage/send permissions, CSRF/version checks, local delivery, unsubscribe/suppression, revoked-send permissions, retries/failures, fixture exclusion and cursor/filter binding. Output: apps/api/.data/communications-visual-contract-test.log.
- Normal local staff session at http://127.0.0.1:5894/admin/communications. Six views checked at 320, 390, 768 and 1440px: contact directory/detail, subscriber directory/detail and newsletter directory/detail. All 24 containment checks passed without page or descendant horizontal overflow. Visual review also confirmed mobile captions/rows, consent policy and newsletter preview.
- Found and repaired the tablet toolbar's compressed status field; final selector measured 180px at 768px viewport.
- Enquiry submitted search and status filtering passed. Keyboard ArrowRight moved from Contact to Subscribers. Suppressed subscriber detail correctly offered only the reasoned suppression-clear action, with no staff confirmation control; no subscriber state changed.
- Newsletter fixture 'Make room for the weekend' temporarily changed its subject, saved successfully as version 2, then restored its original subject/body as version 3. Both actions remain in the audit history. No send control was offered for the fixture and no email was queued. An empty new newsletter showed its placeholder preview and disabled Save; no new record was created.
- Cursor load-more and multi-page directory behavior were not exercised in the browser because existing result sets contain only four contacts, four subscribers and two newsletters. The shared pagination component is established; cursor/filter binding is covered by the API suite. Conflict, denied-access and local-send outcomes are covered by API tests rather than a fresh manual send or permission mutation.
- Existing dirty guards were retained and reviewed; no browser discard-confirmation test is claimed.

Evidence: communications-newsletter-desktop.png, communications-newsletter-mobile.png and communications-inbox-mobile.png in the local Codex visualization folder.

## Deferred

DRM and production email remain pending. Production sender/domain/inbox setup, broader automation and other workflow/API gaps remain separate. Preview rollout READY and hosted verified. Stop before Careers.


Hosted verification: normal preview staff session; all 24 list/detail containment checks passed at 320-1440px, with no captured browser warnings/errors. Submitted search/reset, resolved status, contact history, subscriber policy/suppression controls, newsletter preview/no-outcome state, fixture send exclusion and empty new-draft validation passed. No hosted data changes, sends, consent actions or permission grants. Evidence: communications-hosted-inbox.png and communications-hosted-newsletter.png.
