import { publishedContent } from './published';
import type { Locale } from './schema';

/** Resolve stable editorial keys through the same publication map as navigation. */
export async function editorialDestination(
  destination: string,
  locale: Locale,
  site: URL | undefined,
) {
  if (!destination.startsWith('content:')) return destination;
  const key = destination.slice('content:'.length);
  const href = (await publishedContent(site)).resolve(key, locale);
  if (!href) throw new Error(`Missing published content destination: ${key}:${locale}`);
  return href;
}
