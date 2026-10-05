import { footerNavigation } from './footer-navigation';
import {
  pageSchema,
  sharedSchema,
  type Locale,
  type PageData,
  type SharedData,
  type RouteData,
} from './schema';
import { navigationKeys, type UIStrings } from './ui';
import { normalizePath, pageOutput, validateOutputClaims, type OutputClaim } from './paths';

interface Entry<T> {
  data: T;
}
interface Alternate {
  locale: Locale | 'x-default';
  href: string;
}
const uiKeys: Exclude<keyof UIStrings, 'navigation'>[] = [
  'sectionNavigation',
  'menu',
  'home',
  'contact',
  'imprint',
  'privacy',
  'close',
  'back',
  'language',
  'play',
  'pause',
  'videoUnavailable',
  'videoNoScript',
  'transcript',
];

/** The only publication/URL authority. Language never determines an authored path. */
export function createRoutes<T extends Entry<PageData>, S extends Entry<SharedData>>(
  pages: T[],
  shared: S[],
  strings: Partial<Record<Locale, UIStrings>>,
  origin: string,
  reservedOutputs: OutputClaim[] = [],
) {
  const site = new URL(origin);
  if (site.protocol !== 'https:' || site.hostname === 'localhost' || site.pathname !== '/') {
    throw new Error('A verified HTTPS production origin at the domain root is required');
  }
  const identities = new Set<string>();
  const paths = new Set<string>();
  const sharedIdentities = new Set<string>();
  for (const item of shared) {
    sharedSchema.parse(item.data);
    const id = `${item.data.translationKey}:${item.data.locale}`;
    if (sharedIdentities.has(id)) throw new Error(`Duplicate shared identity: ${id}`);
    sharedIdentities.add(id);
  }
  for (const item of pages) pageSchema.parse(item.data);
  const path = (data: RouteData) => normalizePath(data.slug);
  const all = [...pages, ...shared];
  for (const item of all) {
    const data = item.data;
    const id = `${data.translationKey}:${data.locale}`;
    if (identities.has(id)) throw new Error(`Duplicate translation identity: ${id}`);
    if (paths.has(path(data))) throw new Error(`Duplicate route: ${path(data)}`);
    identities.add(id);
    paths.add(path(data));
    if (data.publication !== 'published') continue;
    const dictionary = strings[data.locale];
    if (
      !dictionary ||
      uiKeys.some((key) => !dictionary[key]?.trim()) ||
      navigationKeys.some((key) => !dictionary.navigation?.[key]?.trim())
    ) {
      throw new Error(`Incomplete UI for published locale: ${data.locale}`);
    }
    for (const key of [footerNavigation.primary, ...footerNavigation.legal]) {
      if (
        !shared.some(
          (entry) =>
            entry.data.translationKey === key &&
            entry.data.locale === data.locale &&
            entry.data.publication === 'published',
        )
      ) {
        throw new Error(`Missing published shared reference: ${key}:${data.locale}`);
      }
    }
  }
  validateOutputClaims([
    ...reservedOutputs,
    ...all.map((entry) => ({
      file: pageOutput(path(entry.data)),
      owner: `${entry.data.translationKey}:${entry.data.locale} (${entry.data.publication})`,
    })),
  ]);
  const published = all.filter((entry) => entry.data.publication === 'published');
  const find = (key: string, locale: Locale) =>
    published.find((entry) => entry.data.translationKey === key && entry.data.locale === locale);
  const resolve = (key: string, locale: Locale) => {
    const entry = find(key, locale);
    return entry ? path(entry.data) : undefined;
  };
  const canonical = (key: string, locale: Locale) => {
    const url = resolve(key, locale);
    if (!url) throw new Error(`Not published: ${key}:${locale}`);
    return new URL(url, site).href;
  };
  const equivalents = (key: string) =>
    published.filter((entry) => entry.data.translationKey === key);
  const alternates = (key: string): Alternate[] => {
    const result: Alternate[] = equivalents(key).map((entry) => ({
      locale: entry.data.locale,
      href: canonical(key, entry.data.locale),
    }));
    const german = resolve(key, 'de');
    if (german) result.push({ locale: 'x-default', href: new URL(german, site).href });
    return result;
  };
  return { published, path, find, resolve, canonical, equivalents, alternates };
}
