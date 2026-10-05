import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';

// Editorial URLs remain stable identifiers, not public raster URLs.
const rasters = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/images/*.{jpg,JPG,jpeg,png,webp}',
  { eager: true },
);
const vectors = import.meta.glob('../../public/svg/*.svg', {
  query: '?url',
  import: 'default',
  eager: true,
});
export function imageAsset(reference: string): ImageMetadata | string {
  if (/^\/svg\/[\w-]+\.svg$/.test(reference) && `../../public${reference}` in vectors)
    return reference;
  if (/^\/img\/[\w-]+\.(jpg|JPG|jpeg|png|webp)$/.test(reference)) {
    const asset = rasters[`../assets/images/${reference.slice(5)}`]?.default;
    if (asset) return asset;
  }
  throw new Error(`Missing or invalid image asset: ${reference}`);
}

export function imageWidths(image: ImageMetadata, maxWidth = 1920): number[] {
  const cap = Math.min(image.width, maxWidth);
  return [
    ...new Set([320, 640, 960, 1280, 1440, 1600, 1920].filter((width) => width < cap).concat(cap)),
  ];
}

/** Poster APIs accept a single URL, not format negotiation or srcset. */
export async function posterUrl(reference: string | undefined): Promise<string | undefined> {
  if (!reference) return undefined;
  const src = imageAsset(reference);
  if (typeof src === 'string') return src;
  return (
    await getImage({
      src,
      width: Math.min(src.width, 1280),
      format: src.format === 'png' ? 'png' : 'jpg',
      quality: 80,
    })
  ).src;
}
