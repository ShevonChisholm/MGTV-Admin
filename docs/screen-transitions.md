# Screen transitions — local handoff

28 October 2026: implemented a 160ms opacity-only route fade. Initial document loads and query-only changes stay immediate. Reduced-motion preference prevents fades and cancels any active fade when enabled. No animation-driven page remounts, transforms, delayed navigation or new dependencies.

Customer transitions wrap only MainLayout and Auth form outlets; navigation/footer and the persistent audio provider/dock stay outside. Admin transitions wrap only workspace content below PageHeader and inside the existing staff session boundary; sidebar/topbar and unsaved-navigation guards remain unchanged.

Both frontend type checks/builds, shared motion checks (reduced-motion suppression/live cancellation/cleanup/unsupported API), customer playback/session/route checks and representative customer/admin browser navigation passed. Customer paused real audio remained at 0:10 through navigation/history. Auth recovery and authenticated Commerce list/detail/history checks passed; 390px layouts had 380px document widths, with no captured browser errors. Physical OS motion toggling/native Safari is not claimed; reduced-motion branches were verified deterministically.

Full scope and evidence: C:/Development/MGTV/docs/screen-transitions.md. Not deployed. DRM and production email remain pending. Stop before the next enhancement.
