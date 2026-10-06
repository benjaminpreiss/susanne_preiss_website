# Own animation choreography in state-driven CSS

Superseded by [ADR 0004: shared GSAP motion](0004-shared-gsap-motion.md) after the owner prioritized readable, reversible timelines over removing the dependency.

The owner approved replacing GSAP with native CSS and clarified that removing the library while retaining JavaScript animation tracks was insufficient: selectors, poses, easing, durations and sequencing delays belong in CSS, triggered by menu/page state attributes. Retain Astro ClientRouter and a small JavaScript coordinator for state, active-slide selection, CSS completion/cancellation, focus and scroll lifecycle; this trades a general reversible timeline for explicit CSS opening/closing states, including early interruption, without JS-rendered frames or a replacement animation framework. This supersedes only the GSAP portion of [ADR 0001](0001-client-router-for-sequential-page-motion.md), retaining its sequential exit → swap → entrance and static/no-JavaScript requirements.
