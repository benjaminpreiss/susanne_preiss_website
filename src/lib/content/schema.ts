import { z } from 'astro/zod';
import { normalizePath } from './paths';

export const authoredPathSchema = z.string().transform((value, context) => {
  try {
    return normalizePath(value);
  } catch (error) {
    context.addIssue({
      code: 'custom',
      message: error instanceof Error ? error.message : 'Invalid authored path',
    });
    return z.NEVER;
  }
});

export const localeSchema = z.enum(['de', 'en']);
export type Locale = z.infer<typeof localeSchema>;
const requiredText = z.string().trim().min(1);
const identity = {
  translationKey: requiredText.regex(/^[a-z][a-z0-9-]*$/),
  locale: localeSchema,
  publication: z.enum(['draft', 'published']),
  title: requiredText,
};
export const sharedKeys = ['contact', 'imprint', 'privacy'] as const;
export const routeSchema = z.strictObject({
  ...identity,
  slug: authoredPathSchema,
  description: requiredText,
});
export const pageSchema = routeSchema.extend({
  // Opt in only when the localized visible page substantiates this entity.
  structuredData: z
    .strictObject({
      type: z.enum(['Service', 'Course']),
      name: requiredText,
      description: requiredText,
    })
    .optional(),
  hero: requiredText.regex(/^\/img\/[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|webp|svg)$/),
  // Empty alt deliberately preserves decorative legacy background imagery.
  heroAlt: z.string(),
  heroPosition: z.enum(['left center', 'center center', 'center top']).optional(),
  heroTone: z.enum(['light', 'dark']).optional(),
});
export const sharedSchema = routeSchema.extend({
  translationKey: z.enum(sharedKeys),
});
export type RouteData = z.infer<typeof routeSchema>;
export type PageData = z.infer<typeof pageSchema>;
export type SharedData = z.infer<typeof sharedSchema>;
