import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { pageSchema, sharedSchema } from './lib/content/schema';

// IDs follow filenames, not frontmatter slugs, so duplicates cannot silently overwrite.
export const collections = {
  pages: defineCollection({
    loader: glob({
      pattern: '**/*.mdoc',
      base: './content/pages',
      generateId: ({ entry }) => entry,
    }),
    schema: pageSchema,
  }),
  shared: defineCollection({
    loader: glob({
      pattern: '**/*.mdoc',
      base: './content/shared',
      generateId: ({ entry }) => entry,
    }),
    schema: sharedSchema,
  }),
};
