# Fonts

Fonts are self-hosted from pinned npm dependencies, not a runtime CDN:

- `@fontsource/cormorant-garamond`: 300 italic
- `@fontsource/open-sans`: 400 and 600 normal
- `@fontsource/roboto`: 400 normal

`src/styles/fonts.scss` uses Fontsource's public `scss` metadata exports to emit
only Latin and Latin Extended faces with the provider's Unicode ranges. Font
binaries remain supplied by the pinned packages. Builds need no font-provider
network requests once dependencies are installed. The generated files are served
from hashed `/_astro/` URLs.

The Latin Cormorant heading face is preloaded only on editorial pages. Other faces
load on demand with Fontsource's `font-display: swap`. Existing CSS font-family
names, weights and styles are unchanged.

Only WOFF2 is shipped. Font URLs use Vite's `?no-inline` flag so small files cannot
become base64 payloads in render-blocking CSS. Importing the full weight/style CSS
previously included 34 faces, and Vite embedded six Greek Extended font files in
the stylesheet. Unicode ranges do not prevent that embedded data from downloading.
The subsetted build has eight faces and no embedded fonts.

Avoid combining subset-only CSS imports without reviewing their Unicode ranges:
some Fontsource subset files omit `unicode-range` and can override one another.
Languages beyond the Latin subsets need an explicit font-coverage review.

Licenses copied from each installed package's `LICENSE` are shipped in
`public/fonts/*-OFL.txt`. `tests/fonts.test.ts` checks the output font files,
preload, the eight external WOFF2 faces, absence of external font stylesheets and
exact license copies. Refresh
these copies and repeat typography/visual checks when updating packages, because
upstream font versions can change outlines or metrics.

See https://fontsource.org/docs/getting-started/install for package usage.
