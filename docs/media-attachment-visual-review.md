# Shared media attachment visual previews and recovery

30 October 2026. Deployed READY and authenticated hosted verification passed. Branch: codex/media-attachment-visual.

## Changes

The shared MediaAttachment control now shows an image thumbnail or a type-specific audio/video tile, filename, readiness badge, verified dimensions/duration/size and the exact selected version ID. Audio and video previews open only when staff request them. Audio uses dark native controls with preload=none. Video reuses the existing authenticated ReviewVideo path; native playback failures now display a recovery message and attachment previews can remount through Retry playback.

Selected-file metadata has visible loading, unavailable/error and retry states. Empty and processing files have explicit presentations; processing images retain the correct type and cannot preview as ready media. Refresh file details rechecks readiness without polling. Image artwork and audio playback failures can be retried independently. Flexible layouts, restrained icons and MGTV charcoal/gold styling replace the text-only selected-file summary.

The exact controlled version remains authoritative. Stale responses cannot replace a newer selection, mismatched version responses are not previewed, and read permission is checked before metadata or private preview rendering. A picker closes if media.read is revoked. Existing native upload filtering, resumable upload flow, duration/readiness checks, parent busy notifications, dirty-navigation protection and entity save/publication validation remain in place. Selection/removal never deletes the library asset; the helper text explicitly requires saving the entity to apply changes. Read-only editors can inspect allowed private previews; upload and mutation controls retain their existing permission/disabled gates.

No API/schema changes, new dependencies, permission grants, uploads, provider processing, paid jobs or production email activation. No customer player redesign. No next area started. DRM and production email remain pending.

## Verification

- Admin TypeScript and production Vite build passed. Existing large-bundle warning remains.
- Ten focused component regressions passed in scripts/check-media-attachments.mjs. The isolated hook/event harness checks media.read restriction, stale metadata responses, visible retry without selection mutation, exact version matching, clip/type/readiness limits, on-demand audio/video mounting, revocation while picker is open, artwork retry and processing images. These are component-level checks, not a substitute for browser playback or a server permission assessment.
- Two existing direct-upload regressions passed in scripts/check-direct-uploads.mjs: R2 multipart resume and Mux acknowledged-offset recovery. No real upload was performed for this UI pass.
- Normal local staff session checked existing Podcast series/episode editors at http://127.0.0.1:5894. Selected image artwork and verified details rendered. Video preview started paused, then native user playback advanced to 7.38s of a 12s generated sample, readyState 4 and no media error. Audio advanced to 9.05s of a 24s generated sample, readyState 4 and no media error. Previews closed afterward.
- Twenty responsive checks passed at 320/390/768/1440px covering selected summaries, expanded video, audio/empty attachments, the image picker and expanded audio. No horizontal page or relevant component overflow. Final compact-card alignment and dark audio controls visually inspected. Temporary viewport override reset.
- Image picker displayed ready image cards. Removing the cover changed only the in-memory draft; Discard and reload restored the original saved image/version. No successful entity save, publish/archive action or media deletion was performed. File-detail retry/failure, wrong-kind and stale-response scenarios were covered by component regressions rather than forced network outages in the browser.
- No captured browser warnings/errors in the final review tab. Earlier browser automation click/screenshot timeouts were recovered using a fresh tab and native controls; actual playback subsequently passed.

Evidence in the Codex visualization folder: media-attachment-visual-desktop.png and media-attachment-visual-mobile.png.

Commands:
- node --experimental-vm-modules --test scripts/check-media-attachments.mjs
- node --experimental-vm-modules --test scripts/check-direct-uploads.mjs
- node node_modules/typescript/bin/tsc --noEmit
- node node_modules/vite/bin/vite.js build

## Release boundary

The earlier Discovery/Commerce repairs are live and hosted-smoke-verified. See discovery-commerce-preview-release.json. This attachment UI is separately deployed as dpl_HjvSBQXuBVfeGMDs7fr3CSX1eYo7 from f9ec8d7. See media-attachment-preview-release.json.

## Hosted acceptance - 30 October 2026

Normal preview staff authentication at the stable admin alias. Saved image and video thumbnail summaries rendered with exact version IDs and verified metadata. On-demand video advanced to 9.24s and audio to 13.31s with readyState 4 and no media error; both were closed afterward. No autoplay observed. All 20 hosted responsive checks passed at 320/390/768/1440px, without horizontal page/component overflow. Metadata refresh retained the saved version. The ready-image picker worked; selecting an alternate image affected only the client draft, and Discard restored the original image/version. No successful entity save or API mutation, upload, deletion, paid processing or access changes. No captured browser warnings/errors. Temporary viewport override reset. Hosted evidence: media-attachment-hosted-desktop.png and media-attachment-hosted-mobile.png in the Codex visualization folder.
