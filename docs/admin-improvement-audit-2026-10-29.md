# Admin improvement scan - 29 October 2026

## Scope and limits

The tracked first-pass visual queue has been deployed, including Platform Settings commit 7ae60d7. Its authenticated hosted verification subsequently passed on 30 October 2026 using the normal preview staff sign-in (see platform-settings-preview-release.json). The local session also expired when a further screen inspection was attempted. No authentication was bypassed, grants changed or credentials read.

This is a targeted source/workflow audit, supported by the recent local responsive screenshots. It is not a fresh end-to-end browser audit of every admin screen, a security assessment, or proof that all existing module gaps are closed. No application fixes from this scan were implemented.

## Existing workflow issues - address before cosmetic work

| Priority | Finding and evidence | Recommended next increment |
| --- | --- | --- |
| P1 | Discovery supports 12 kinds, but DiscoveryTermDto.contentKinds uses ArrayMaxSize(11). A validation-only probe against the existing compiled DTO, with all supported kinds, returned the arrayMaxSize error. No record was submitted or written. Sources: apps/api/src/modules/discovery/models/discovery.ts:1 and dto/discovery.dto.ts:31. | Align the maximum with the registered kinds and cover all-kinds category save plus invalid/duplicate types. Preserve explicit permissions and existing term behavior. |
| P1 | Commerce option cards call toLocaleString() without a timezone, then print the option's timezone beside the result. A staff browser in a different timezone can therefore see a clock time labelled with the wrong zone. Source: src/admin/pages/ConnectedCommerce.tsx:296. A read-only example instant, 2026-10-29T18:00Z, is 13:00 in Jamaica and 14:00 in New York. The defect is source-confirmed; a cross-timezone browser reproduction remains to be done. | Format slot start/end in the option's IANA timezone and show its label explicitly. Check daylight-saving boundaries and a staff timezone different from the slot. Do not change stored instants or booking policies. |
| Conditional P1 | Homepage curation's registered kinds still omit Podcasts, though Discovery registers it. Source: apps/api/src/modules/homepage/models/homepage.ts:11. This was already deferred in the roadmap. | Complete the entity relationship if Podcasts must be available in curated home sections. Define eligible series/episode/hero behavior rather than merely adding an option that the backend cannot resolve. |

## Next visual/usability opportunities

1. **Shared media attachment previews and recovery (highest-value visual pass).** MediaAttachment presents the selected filename/state as text; its metadata-read failure is silently caught. Some individual editors show saved artwork, but this shared attachment control itself has no selected image/audio/video preview. Sources: src/admin/components/MediaAttachment.tsx:69-81 and 146-166. Reuse the connected library's visual treatment for selected files, show verified dimensions/duration and processing/error state, add explicit metadata retry, and distinguish a saved attachment from a pending replacement. Preserve private access, version identity, upload resumability and the requirement to save the entity. No cloud upload or paid processing is necessary for the UI pass.

2. **Admin navigation tailored to actual access.** Sidebar renders all static groups/items without session-permission filtering (Sidebar.tsx:199/217). It also requests moderation summary whenever the active module changes, without first checking moderation.read (line 91); that endpoint requires the permission. Server access remains enforced, so this is navigation/request hygiene rather than an access-control bypass. Add clear permitted destinations and an intentional restricted-access explanation where appropriate, while preserving route guards. A compact navigation search or recent-work shortcuts would reduce scanning across the long menu. Restricted-account reproduction is pending; no role or grant was changed for this audit.

3. **Compact mobile task headers.** Recent 390px Settings evidence shows the hero, saved-summary tiles and section navigation taking most of the first viewport before editable fields. Careers also repeats the role title in the workspace heading and saved snapshot. The rich desktop treatment can remain while phone summaries become compact or collapsible and primary work appears earlier. Evidence: platform-settings-preferences-mobile.png, platform-settings-organization-desktop.png and careers-overview-mobile.png from the verified visual passes. No page overflow was found; this is task-density refinement, not an overflow defect.

4. **Consistent review, save and confirmation patterns.** Several older editor histories still use browser-local timestamps without an explicit zone (Music library, Events, Homepage, Discovery and Access), while newer screens label Jamaica time. Use an explicit context-specific timezone: event/booking zone for schedules, an agreed labelled staff/reporting zone for audit times. Browser-native window.confirm remains in Awards category removal, Editorial, Communications and Careers reload, alongside the existing branded dialog/router guard. Unify the visual pattern without weakening reason/version/permission checks; test focus restoration, keyboard escape and in-flight request handling. Sources: ConnectedAwards.tsx:568; ConnectedEditorial.tsx:635; ConnectedCommunications.tsx:63/138; ConnectedCareers.tsx:230; ui/index.tsx:135; ConnectedMusicLibrary.tsx:673; ConnectedEvents.tsx:921.

5. **Long-form actions and list-scale consistency.** PageActions is rendered in a normal page header; the header itself is not sticky. Some editors have an independent sticky aside, others have save/review controls further down their form. Standardize action placement on long desktop and mobile forms and keep saved/unsaved status visible. Cursor loading, local table/card pagination and Reset wording also differ by module. Audit these as one shared interaction pass at larger record counts; do not replace server search with filtering only the first loaded page. Sources: components/PageHeader.tsx:19/25; index.css:108/217; ConnectedMusicLibrary.tsx:232-310; ConnectedCareers.tsx; ConnectedCommunications.tsx.

6. **Current-status documentation index.** Older development backlogs intentionally retain historical designs-only/no-backend statements and old stop boundaries. A short current-status index should point to the latest release records, active gaps and owner decisions so those historical sections are not mistaken for the baseline. Preserve history and link to it rather than silently overwriting it.

## Recommended order

1. Finish the authenticated hosted Platform Settings verification after normal preview sign-in.
2. Repair the Discovery limit and Commerce timezone-label defect as a small reliability increment.
3. Improve the shared selected-media attachment experience.
4. Refine navigation and compact mobile summaries.
5. Standardize confirmation/review/action placement and timestamp labels, then test larger lists.
6. Complete Podcasts/Homepage registration when its curation behavior is agreed, keeping that relationship work separate from decoration.

## Launch work stays separate

DRM and production email/domain/inbox remain pending. Live merchant/commercial/tax decisions, reliable production hosting/operations, partner financial execution, and outstanding media/device acceptance remain on their existing tracks. This visual audit does not mark those items complete or authorize new provider costs.
