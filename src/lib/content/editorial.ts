import { z } from 'astro/zod';
import { localeSchema } from './schema';
import { isImagePosition } from './image-position';

const key = z.string().regex(/^[a-z][a-z0-9-]*$/);
const image = z.string().regex(/^\/(?:img|svg)\/[a-zA-Z0-9_-]+\.(?:jpg|JPG|jpeg|png|webp|svg)$/);
const https = z.url().startsWith('https://');
const destination = z.union([
  z.string().regex(/^\/pdf\/[a-zA-Z0-9_-]+\.pdf$/),
  https,
  z.string().regex(/^content:[a-z][a-z0-9-]*$/),
]);
const identity = { key };
const imagePosition = z.string().refine(isImagePosition, 'Expected a valid CSS image position');
const imagePositions = {
  imagePosition: imagePosition.default('center top'),
  mobileImagePosition: imagePosition.optional(),
};
const homeControls = {
  tone: z.enum(['dark', 'light']).default('dark'),
  mobileMenuTone: z.enum(['dark', 'light']).optional(),
  hideNavigation: z.boolean().default(false),
};
const media = { image, alt: z.string(), side: z.enum(['left', 'right']).default('left') };
export const editorialSchemas = {
  article: z.strictObject({}),
  'home-intro': z.strictObject({
    ...identity,
    image,
    alt: z.string(),
    ...imagePositions,
    ...homeControls,
  }),
  'home-tile': z.strictObject({
    ...identity,
    ...media,
    destination: z.string().regex(/^content:[a-z][a-z0-9-]*$/),
    mobileImage: image.optional(),
    ...homeControls,
    ...imagePositions,
    arrow: z.enum(['below', 'inline']).default('below'),
  }),
  prose: z.strictObject(identity),
  heading: z.strictObject({ ...identity, centered: z.boolean().optional() }),
  'resource-list': z.strictObject({}),
  resource: z
    .strictObject({ ...identity, destination, image: image.optional(), alt: z.string().optional() })
    .superRefine((data, ctx) => {
      if (data.image !== undefined && data.alt === undefined)
        ctx.addIssue({
          code: 'custom',
          message: 'An image requires alt (empty is allowed for decorative images)',
        });
      if (data.alt !== undefined && data.image === undefined)
        ctx.addIssue({ code: 'custom', message: 'alt requires an image' });
    }),
  course: z.strictObject({ ...identity, ...media, destination }),
  illustration: z.strictObject({ ...identity, ...media }),
  video: z
    .strictObject({
      ...identity,
      id: key,
      src: https,
      poster: image.optional(),
      title: z.string().trim().min(1),
      cover: z.enum(['workshop', 'talk']).default('workshop'),
      coverImage: image.optional(),
      mediaLocale: localeSchema.optional(),
      captionSrc: z
        .union([https, z.string().regex(/^\/captions\/[a-zA-Z0-9_-]+\.vtt$/)])
        .optional(),
      captionLocale: localeSchema.optional(),
      captionLabel: z.string().trim().min(1).optional(),
      transcript: destination.optional(),
      transcriptLocale: localeSchema.optional(),
    })
    .superRefine((data, ctx) => {
      if ((data.cover === 'talk') !== !!data.coverImage)
        ctx.addIssue({ code: 'custom', message: 'Only talk covers require coverImage' });
      const captions = [data.captionSrc, data.captionLocale, data.captionLabel];
      if (captions.some(Boolean) && !captions.every(Boolean))
        ctx.addIssue({
          code: 'custom',
          message: 'Captions require captionSrc, captionLocale and captionLabel',
        });
      if (!!data.transcript !== !!data.transcriptLocale)
        ctx.addIssue({
          code: 'custom',
          message: 'Transcripts require transcript and transcriptLocale',
        });
    }),
  br: z.strictObject({}),
};
export type HomeIntroProps = z.infer<(typeof editorialSchemas)['home-intro']>;
export type HomeTileProps = z.infer<(typeof editorialSchemas)['home-tile']>;
export type ProseProps = z.infer<typeof editorialSchemas.prose>;
export type HeadingProps = z.infer<typeof editorialSchemas.heading>;
export type ResourceProps = z.infer<typeof editorialSchemas.resource>;
export type CourseProps = z.infer<typeof editorialSchemas.course>;
export type IllustrationProps = z.infer<typeof editorialSchemas.illustration>;
export type VideoProps = z.infer<typeof editorialSchemas.video>;
