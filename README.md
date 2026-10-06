# Static website

Astro prerenders each published Markdoc entry; Svelte islands own interactive menus
and media. Shared GSAP timelines provide coordinated motion alongside Astro ClientRouter. Ordinary links and
per-route HTML work without JavaScript. No server adapter, request-time runtime,
automatic language negotiation or SPA catch-all is required.

## Development

Run from the repository root with Node >=22.12.0 and pnpm 10.8.0 (Node 24.20.0 verified):

```sh
pnpm install --frozen-lockfile
pnpm dev       # Astro development
pnpm check     # alias for full typecheck (Astro, Svelte, standalone TS/JS)
pnpm lint      # check Oxlint rules; pnpm lint:fix applies safe fixes
pnpm format:check # check formatting; pnpm format writes changes
pnpm build     # static generation and link/asset validation
pnpm test      # unit/parity tests and isolated actual Astro content builds
pnpm preview   # serve dist locally
pnpm start     # alias for preview
```

One root pnpm lockfile covers this workspace. Approved native build dependencies are
listed in `pnpm-workspace.yaml`. `ASTRO_TELEMETRY_DISABLED=1` disables telemetry.
Build before testing or previewing; tests inspect `dist/`. Negative and bilingual tests
build disposable `.fixture-*` directories without changing production content.

Installation enables Husky pre-commit checks: staged formatting/lint fixes, then full
`pnpm typecheck`. CI uses `HUSKY=0 pnpm install --frozen-lockfile` and runs checks
explicitly. See [quality tooling](docs/quality-tooling.md) for commands, exact file
coverage (including Astro/Markdoc fallbacks), exclusions and troubleshooting.
See [static CI and artifact handoff](docs/static-validation.md) for browser smoke
checks, seven-day tested master artifacts, download verification and hosting limits.
See [dependency maintenance](docs/dependency-maintenance.md) for GitHub-native Dependabot,
weekly update policy and owner-gated activation (automerge is disabled initially).

## Editorial content and publication

Start with [the editor guide](content/README.md). `content/` contains editable Markdoc
and JSON; `src/lib/content/` contains validation and routing. `@astrojs/markdoc` uses
explicit validated Astro-backed tags defined in `markdoc.config.ts`. Reorder complete
blocks in the document body, not a frontmatter section array. Unknown tags/attributes,
invalid nesting, incomplete metadata and missing references fail the build. Shared
contact/legal prose has a single canonical entry in `content/shared/`.

Each entry has a stable `translationKey`, explicit `locale`, `publication`, localized
metadata and complete root-relative `slug`. Paths do not determine language. Only
published entries generate routes. German home is `/`; an English home at `/en/`
requires a genuinely translated published entry authored at that path.

To publish English without routing-code changes:

1. Create the translated `.mdoc` entry with the same translation key, `locale: en`,
   a localized authored path/title/description and translated prose/media labels.
2. Supply translated English UI in `content/ui.json` and published translated shared
   contact/imprint/privacy dependencies; do not reuse German legal prose as English.
3. Keep incomplete work in draft. Mark entries published only when ready.
4. Run check, build and tests; inspect same-page language switching, metadata and media
   controls. Switch links/hreflang exist only for published equivalents. Partial
   translations do not create fallback copies or links to absent pages.

English test fixtures under `tests/fixtures/` are never production content. Footer
roles live in `content/settings/navigation.json`; Kontakt, Impressum and Datenschutz
are footer-only, not main-menu entries.

## Routes and static hosting

The eleven original German pages are `/`, `/ueber-mich/`, `/personalentwicklung/`,
`/business-coaching/`, `/top-management-sparring/`, `/key-note-speaker/`, `/workshops/`,
`/online-training/`, `/regenerative-changemaker/`, `/nachhaltigkeit/` and `/presse/`.
Standalone shared pages are `/kontakt/`, `/impressum/` and `/datenschutz/`.

The owner-confirmed production origin is `https://susanne-preiss.de/` (ticket 01).
`src/pages/[...slug].astro` enumerates published authored paths at build time. Optional
trailing slashes normalize to directory indexes. Root renders German content directly;
`/index.html` is the same physical file, never a redirect replacing the homepage.

`content/settings/legacy-routes.json` maps legacy and intermediate `/de/...` aliases
to translation keys. Targets resolve directly to current authored paths. This settings file is the source
alias manifest. Output includes portable HTML redirects: immediate meta refresh,
absolute canonical, visible no-JavaScript link, and JavaScript preserving query and
fragment. No-JavaScript fragment retention depends on the browser; historical Chromium
meta-refresh checks dropped fragments. Do not claim universal preservation or HTTP
301/308 responses from these documents.

Eventually upload only production `dist/` to a domain-root static host with directory
indexes. Configure unknown paths to return `404.html` **with HTTP status 404**, not a
200 rewrite and not the homepage. Verify with `curl -I` against a nonexistent URL after
upload. Host-specific error-document and optional permanent redirect rules depend on
the actual host; capabilities and live HTTP behavior remain unverified. Do not deploy
fixture builds. Production activation is separately approved after tickets 08–11.

## Interactions and media

The accepted ClientRouter lifecycle sequences exit → swap → entrance and owns
history/focus/cleanup. All GSAP choreography lives in `src/interactions/motion.ts`:
`createMenuMotion` opens/closes one reversible timeline; `createPageMotion` runs one
exit or entrance stage. Both share the active-slide image-up/text-down split in
portrait; page transitions keep the toggle and footer controls in place. Both restore original styles on destruction, settle pending
completion promises, and handle reduced motion. Callers own dialogs and navigation,
not animation details. Simple hover effects and viewport-relative layout stay in CSS;
separate menu offsets leave viewport-relative layout independent. In portrait, the
image slot stays `50svh`; an absolutely positioned picture/image frame inside it
resizes to `50svh + 100dvh - 100svh` over 300ms, synchronized with text translation.
The image fills that changing frame with `object-fit: cover`, so its sizing/crop
really updates rather than revealing a clipped, fixed-size image. Layout containment
keeps the frame's resizing out of surrounding flow; the slot and margins do not animate.
Portrait sections stay `100svh`, text panels stay `50svh`, and the beige gap stays
`100lvh - 100svh`. Copy must fit these fixed boxes; oversized-content expansion is
not supported. There is no toolbar-dependent scroll margin to change snap geometry. See
[the shared GSAP decision](docs/adr/0004-shared-gsap-motion.md).
Native scrolling replaces fullpage.js. The menu uses a native modal dialog with
keyboard/focus management; contact/legal destinations are ordinary pages, not overlays.
Reduced-motion and no-JavaScript paths are covered by browser tests.

All four inventoried video placements share the Video.js 10 player using compatible
`@videojs/html` and `@videojs/hlsjs-video` packages pinned to 10.0.1, not the older
`video.js` package. Controls use the explicit page locale; media language is independent.
Original cover artwork, posters and streaming destinations remain; the packaged Compat
controls are owner-approved. Errors offer retry; no-JavaScript output provides native
video and localized guidance. About/Presse have no video player.

Responsive images use AVIF/WebP with JPEG or alpha-preserving PNG fallback. Original
asset hashes, editorial HTML and existing semantic fragment identifiers are preserved
as test evidence; a retained `fullpage` fragment is not a fullpage.js dependency.

## Verification and historical evidence

Ticket 08 is still in progress. Passing checks from earlier slices do not establish
whole-site cutover acceptance. Physical-device/Safari, full media/network-failure,
deep lifecycle recovery, screenshot comparison and independent review must be reported
explicitly rather than inferred from build success.

Maintained CDP scripts are in `tests/*browser.ts`. Use configurable `TEST_CDP` and
`TEST_SITE` endpoints, with one client at a time. Local verification uses the existing
owner-managed OrbStack browser; do not launch local Chromium or manage OrbStack from
the agent. Transfer an identified immutable production archive into a fresh directory,
serve it separately from the legacy baseline, and verify served hashes before acceptance.
`TEST_LOCAL_BUILD=1` is diagnostic file replay, not actual HTTP acceptance. CI can supply
its own browser/endpoint; it must not depend on OrbStack. Never issue raw `Browser.close`.

`test:navigation` and `test:authored-paths` exercise menu/history and bilingual authored
paths; supplemental homepage, layout, video and resource scripts cover other slices.
Save reports/screenshots to fresh evidence directories; never replace baseline images
merely to make comparisons pass.

Legacy source/configuration and old documentation were hash-verified and archived in
`.scratch/ticket08/legacy-source.tar.gz` before retirement. Ticket 01's exact public
build, source provenance and captures remain untouched in
`.scratch/astro-svelte-migration/baseline/`. Inert legacy editorial HTML plus original
asset SHA-256 values in `tests/fixtures/legacy/` keep parity tests independent of the
retired application/toolchain. They are neither compiled nor delivered to visitors.
