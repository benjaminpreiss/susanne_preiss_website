# Build maintenance

## Responsive Sass

`src/styles/_responsive.scss` owns the subset of RFS 9 sizing the site uses:
non-negative pixel inputs (or unitless zero), rem output, a 20px base, factor 10,
and a 1200px breakpoint in both dimensions. There is no RFS package or package
patch. The original MIT notice is retained in `docs/licenses/rfs.txt`.

The ordered `responsive.values` map emits base declarations first, then the
breakpoint overrides. Include overlapping shorthand/longhand declarations in the
same map to preserve their cascade. Keep unrelated declarations before the mixin.
Do not replace this with `clamp()` without checking rem scaling and breakpoint
behaviour. Tests cover representative values, declaration order and unsupported
inputs, and reject Sass warnings when compiling the application stylesheets.

The replacement was compared against the previous RFS-backed adapter: both
stylesheets produced byte-identical CSS, also after upgrading to Sass 1.105.1.
This checks the replacement, not browser parity of every earlier stylesheet edit.

## Generated Astro directive

Astro 7.3.5's `astroHeadBuildPlugin` determines content propagation from module
metadata and the `astroPropagatedAssets` module ID flag, not the continued presence
of the generated `use astro:head-inject` string in bundled JavaScript.
The owner chose to accept this warning visibly for now; no warning filter or
framework patch is applied. Before revisiting it, add a focused fixture proving
that a Markdoc-only component's scoped CSS and script reach the generated page,
and check upstream Astro/Markdoc/Vite fixes.

## Outstanding diagnostics

- The parent-checkout `astro/tsconfigs/strict` resolution warning did not reproduce
  in the captured baseline or subsequent builds. No tsconfig workaround was added.
- The >500 kB warning concerns the full video playback runtime, not navigation.
  The baseline player bundle was 888,634 bytes minified (242,961 bytes gzip).
  A small eager Svelte shell now reserves the cover layout; it dynamically imports
  `src/interactions/video-runtime.ts` within 400px of the viewport. The full engine
  and controls are retained, so the deferred runtime still exceeds the warning
  threshold. No warning suppression or navigation-loading change was made.
  See `docs/video-loading.md` for behaviour and verification.
- The pnpm warning about reading `~/.npmrc` is a local nono sandbox restriction,
  independent of Astro/Sass. Build configuration does not suppress it.

## Content test policy

Renderer tests build controlled Markdoc content through the real Astro pipeline.
`tests/fixtures/editorial-content.ts` seeds disposable fixture roots, independently
of production page bodies. Exact wording, section order and entity values are
asserted only for these test-owned examples. Schema tests cover invalid inputs.

Production checks verify structure, metadata consistency, discovery, images and
local references, without snapshots of editorial text, fixed page/section counts,
or a list of pages forbidden from adding optional structured data. Historical
migration fixtures are not an ongoing editorial contract. Valid content edits
should not require rewriting tests; renderer or content-schema changes may.
