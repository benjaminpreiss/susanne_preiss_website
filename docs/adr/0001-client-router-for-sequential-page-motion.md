# Use Astro ClientRouter for sequential page motion

The GSAP choice was temporarily superseded by [ADR 0003](0003-state-driven-css-motion.md) and reinstated with a shared-module boundary in [ADR 0004](0004-shared-gsap-motion.md). The ClientRouter and static-fallback decisions remain in effect.

The owner explicitly approved Astro ClientRouter after browser verification exposed intermittent cross-document transition opt-in failures and missing navigation snapshots. Replace the migration draft's earlier “no client router” restriction with ClientRouter for navigation and lifecycle-managed GSAP for live-element exit → swap → entrance choreography. The available record does not establish that the earlier prohibition was an explicit owner instruction.

Keep prerendered per-route HTML and ordinary-anchor/no-JavaScript fallback: deployment remains an upload of static files, with no Node.js runtime or SPA catch-all rewrite. Disable overlapping browser snapshot animations; retain Astro's routing, metadata and route-announcement behavior. The trade-off is explicit ownership of cancellation, menu teardown, focus, input modality and scroll restoration across swaps. This decision approves the implementation direction, not a reliability or visual-parity claim before browser verification.
