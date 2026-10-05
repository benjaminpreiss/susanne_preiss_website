import { z } from 'astro/zod';
import settings from '../../../content/settings/navigation.json';

// Navigation roles are separate from canonical shared-content identity.
export const navigationSettingsSchema = z.strictObject({
  footerNavigation: z.strictObject({
    primary: z.literal('contact'),
    legal: z
      .array(z.enum(['imprint', 'privacy']))
      .length(2)
      .refine((keys) => new Set(keys).size === keys.length, 'Duplicate legal footer reference'),
  }),
});

export const { footerNavigation } = navigationSettingsSchema.parse(settings);
export type FooterReference =
  | typeof footerNavigation.primary
  | (typeof footerNavigation.legal)[number];
