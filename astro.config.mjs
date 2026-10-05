import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import markdoc from '@astrojs/markdoc';

export default defineConfig({
  site: 'https://susanne-preiss.de', // Owner-confirmed in ticket 01.
  output: 'static',
  trailingSlash: 'always',
  integrations: [svelte(), markdoc({ allowHTML: false, typographer: false })],
  // Locale is content identity; static routes use complete editor-authored paths.
  // Do not load the legacy Webpack PostCSS configuration from the parent.
  vite: { css: { postcss: { plugins: [] } } },
});
