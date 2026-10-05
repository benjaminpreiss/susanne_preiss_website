import type { createRoutes } from './routes';
import { sharedKeys, type Locale } from './schema';
import { navigationKeys, languageNames, type UIStrings } from './ui';
import { footerNavigation, type FooterReference } from './footer-navigation';

export function navigationModel(
  routes: ReturnType<typeof createRoutes>,
  key: string,
  locale: Locale,
  strings: UIStrings,
) {
  const footerLink = (translationKey: FooterReference) => {
    const href = routes.resolve(translationKey, locale);
    if (!href) throw new Error(`Missing published shared route: ${translationKey}:${locale}`);
    return {
      key: translationKey,
      href,
      label: strings[translationKey],
      current: translationKey === key,
    };
  };
  const footer = {
    primary: footerLink(footerNavigation.primary),
    legal: footerNavigation.legal.map(footerLink),
  };
  const links = navigationKeys.flatMap((translationKey) => {
    const href = routes.resolve(translationKey, locale);
    return href
      ? [{ href, label: strings.navigation[translationKey], current: translationKey === key }]
      : [];
  });
  const returnHref =
    routes.resolve('home', locale) ??
    routes.resolve('about', locale) ??
    links[0]?.href ??
    [footer.primary, ...footer.legal].find((link) => !link.current)?.href;
  if (!returnHref) throw new Error(`Missing return destination: ${locale}`);
  return {
    footer,
    returnHref,
    isUtility: sharedKeys.some((sharedKey) => sharedKey === key),
    links,
    languages: routes
      .equivalents(key)
      .filter((entry) => entry.data.locale !== locale)
      .map((entry) => ({
        locale: entry.data.locale,
        label: languageNames[entry.data.locale],
        href: routes.path(entry.data),
      })),
    home: routes.resolve('home', locale),
  };
}
