# Fonts

Fonts are self-hosted from pinned npm dependencies, not a runtime CDN:

- `@fontsource/cormorant-garamond`: 300 italic
- `@fontsource/open-sans`: 400 and 600 normal
- `@fontsource/roboto`: 400 normal

`src/styles/fonts.css` imports Fontsource's weight/style CSS. Its Unicode ranges
let browsers request only the subsets used on the page, including Latin Extended
when needed. These CSS imports are bundled by Vite; they are not extra HTTP imports
at runtime. Builds need no font-provider network requests once dependencies are
installed. The generated files are served from hashed `/_astro/` URLs.

The Latin Cormorant heading face is preloaded only on editorial pages. Other faces
load on demand with Fontsource's `font-display: swap`. Existing CSS font-family
names, weights and styles are unchanged.

The full weight/style stylesheets deliberately include all supported subsets and
WOFF fallbacks in the artifact. They do not all download on page load. Avoid
combining subset-only CSS imports without reviewing their Unicode ranges: some
Fontsource subset files omit `unicode-range` and can override one another.

Licenses copied from each installed package's `LICENSE` are shipped in
`public/fonts/*-OFL.txt`. `tests/fonts.test.ts` checks the output font files,
preload, absence of external font stylesheets and exact license copies. Refresh
these copies and repeat typography/visual checks when updating packages, because
upstream font versions can change outlines or metrics.

See https://fontsource.org/docs/getting-started/install for package usage.
