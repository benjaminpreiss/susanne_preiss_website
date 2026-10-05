# Video loading

`Video.astro` deliberately retains `client:load`. The small Svelte shell reserves
the custom cover layout immediately, independently of loading Video.js. Deferring
the whole island caused a layout shift when its native fallback changed height.

The shell observes its container with a 400px root margin, then dynamically imports
`src/interactions/video-runtime.ts`. This module registers the existing player,
Compat skin, HLS adapter and translations. Only after registration does the shell
mount their elements. The browser shares the imported module across players; each
player still waits until its own container approaches the viewport.

The runtime surface has its own stacking layer and stays transparent/noninteractive
until playback is started. Posters, title covers and launch controls sit above it.
The play button remains disabled until the player store is ready, preserving trusted
user activation for the actual play call. Poster loading and hero priorities are
not deferred by this code. Native controls remain the no-JavaScript fallback and
are restored if the runtime import fails.

Unmounting disconnects the observer and ignores late import completions. Existing
playback disposal, ended/reset behaviour and fatal-media retry are retained. The
full HLS runtime is still large: this reduces initial work, not the eventual bundle
size or its build warning.

## Verification

- The fixture build checks native fallback markup and a bounded eager shell size.
- `tests/video-browser.ts` covers real streaming, controls, seeking, fullscreen,
  ended state, navigation teardown/return and no-JavaScript fallback. Scroll to a
  placement before waiting for its runtime elements.
- `tests/video-failure-browser.ts` covers media failures and fallback paths.
- Local CDP artifact replay found no initial runtime/playlist requests on the three
  sampled mobile video pages. Delaying the runtime response by 2.5 seconds while
  scrolling to the player preserved its frame geometry with no recorded layout
  shifts in that sample. These are loading/behaviour checks, not field CWV claims.

Validate with `pnpm build && pnpm preview`, not cold dev-server timings. Check fast
scrolling, direct video fragments, slow networking and first-play response on actual
mobile browsers before deployment.
