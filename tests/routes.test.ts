import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRoutes } from '../src/lib/content/routes';
import { createAliases } from '../src/lib/content/aliases';
import {
  pageSchema,
  sharedSchema,
  sharedKeys,
  type Locale,
  type PageData,
} from '../src/lib/content/schema';
import { ui } from '../src/lib/content/ui';
import { english } from './fixtures/ui';
import { navigationModel } from '../src/lib/content/navigation';
import legacyRoutes from '../content/settings/legacy-routes.json';
import { navigationSettingsSchema, footerNavigation } from '../src/lib/content/footer-navigation';

const strings = { ...ui, en: english };
const shared = (['de', 'en'] satisfies Locale[]).flatMap((locale) =>
  sharedKeys.map((translationKey) => ({
    data: sharedSchema.parse({
      translationKey,
      locale,
      publication: 'published',
      title: translationKey,
      slug: `/${locale}/${translationKey}`,
      description: `${locale} ${translationKey}`,
    }),
  })),
);
const page = (overrides: Partial<PageData> = {}) => ({
  data: pageSchema.parse({
    translationKey: 'about',
    locale: 'de',
    publication: 'published',
    slug: '/ueber-mich',
    title: 'Titel',
    description: 'Beschreibung',
    hero: '/img/about_start_2.jpg',
    heroAlt: 'Porträt',
    ...overrides,
  }),
});
const german = page();
const englishPage = page({
  locale: 'en',
  slug: '/about-susanne',
  title: 'About',
  description: 'English description',
  heroAlt: 'Portrait',
});
const make = (pages = [german, englishPage], dependencies = shared, dictionaries = strings) =>
  createRoutes(pages, dependencies, dictionaries, 'https://susanne-preiss.de/');

test('published equivalents use independent authored paths and self-canonicals', () => {
  const routes = make();
  assert.equal(routes.resolve('about', 'en'), '/about-susanne/');
  assert.equal(routes.canonical('about', 'en'), 'https://susanne-preiss.de/about-susanne/');
  assert.deepEqual(routes.alternates('about'), [
    { locale: 'de', href: 'https://susanne-preiss.de/ueber-mich/' },
    { locale: 'en', href: 'https://susanne-preiss.de/about-susanne/' },
    { locale: 'x-default', href: 'https://susanne-preiss.de/ueber-mich/' },
  ]);
});
test('owner examples resolve by identity, never path resemblance', () => {
  const dependencies = shared.map((entry) =>
    entry.data.translationKey === 'contact'
      ? { data: { ...entry.data, slug: entry.data.locale === 'de' ? '/kontakt' : '/contact' } }
      : entry,
  );
  const routes = make(
    [
      page({ translationKey: 'home', slug: '/' }),
      page({ translationKey: 'home', locale: 'en', slug: '/en/' }),
      page({ translationKey: 'changemaker', slug: '/regenerative-changemaker' }),
      page({ translationKey: 'changemaker', locale: 'en', slug: '/en/regenerative-changemaker' }),
    ],
    dependencies,
  );
  for (const [key, locale, expected] of [
    ['home', 'de', '/'],
    ['home', 'en', '/en/'],
    ['contact', 'de', '/kontakt/'],
    ['contact', 'en', '/contact/'],
    ['changemaker', 'de', '/regenerative-changemaker/'],
    ['changemaker', 'en', '/en/regenerative-changemaker/'],
  ] satisfies [string, Locale, string][])
    assert.equal(routes.resolve(key, locale), expected);
  assert.deepEqual(navigationModel(routes, 'contact', 'en', english).languages, [
    { locale: 'de', label: 'Deutsch', href: '/kontakt/' },
  ]);
});
test('shared pages use the same publication resolver and support nested paths', () => {
  const dependencies = shared.map((entry) =>
    entry.data.locale === 'en' && entry.data.translationKey === 'privacy'
      ? { data: { ...entry.data, slug: '/legal/privacy-policy' } }
      : entry,
  );
  const routes = make([german, englishPage], dependencies);
  assert.equal(routes.resolve('privacy', 'en'), '/legal/privacy-policy/');
  assert.equal(routes.equivalents('privacy').length, 2);
  assert.equal(
    navigationModel(routes, 'privacy', 'en', english).footer.legal.find(
      (link) => link.key === 'privacy',
    )?.href,
    '/legal/privacy-policy/',
  );
  for (const patch of [{ slug: '' }, { description: '' }, { title: '' }])
    assert.equal(sharedSchema.safeParse({ ...shared[0]!.data, ...patch }).success, false);
});
test('partial publication does not invent equivalents or a German x-default', () => {
  const routes = make([
    german,
    englishPage,
    page({ translationKey: 'workshops', slug: '/workshops' }),
  ]);
  assert.equal(routes.published.length, 9);
  assert.equal(routes.resolve('workshops', 'en'), undefined);
  assert.equal(routes.equivalents('workshops').length, 1);
  assert.deepEqual(make([englishPage]).alternates('about'), [
    { locale: 'en', href: 'https://susanne-preiss.de/about-susanne/' },
  ]);
});
test('draft or absent equivalents never become routes or alternates', () => {
  for (const pages of [
    [german],
    [german, page({ locale: 'en', slug: '/draft-about', publication: 'draft' })],
  ]) {
    const routes = make(pages);
    assert.equal(routes.resolve('about', 'en'), undefined);
    assert.equal(routes.alternates('about').length, 2);
    assert.throws(() => routes.canonical('about', 'en'), /Not published/);
    assert.deepEqual(navigationModel(routes, 'about', 'de', ui.de!).languages, []);
  }
});
test('duplicate identities and normalized routes fail across locales, collections and drafts', () => {
  assert.throws(() => make([german, page({ slug: '/other' })]), /Duplicate translation identity/);
  assert.throws(
    () => make([german, page({ locale: 'en', slug: '/ueber-mich/', publication: 'draft' })]),
    /Duplicate route/,
  );
  assert.throws(() => make([german], [...shared, shared[0]!]), /Duplicate shared identity/);
  assert.throws(
    () => make([german, page({ translationKey: 'contact', slug: '/another-contact' })]),
    /Duplicate translation identity/,
  );
  assert.throws(() => make([page({ slug: '/en/privacy' })]), /Duplicate route/);
  assert.throws(
    () => make([page({ slug: '/' }), page({ locale: 'en', slug: '/', publication: 'draft' })]),
    /Duplicate route/,
  );
  assert.throws(
    () =>
      createRoutes([german], shared, strings, 'https://susanne-preiss.de/', [
        { file: 'ueber-mich', owner: 'public file' },
      ]),
    /file\/directory conflict/,
  );
});
test('required UI and shared dependencies block publication, not drafts', () => {
  assert.throws(
    () => make([englishPage], shared, { de: ui.de, en: { ...english, close: '' } }),
    /Incomplete UI/,
  );
  assert.throws(
    () =>
      make([englishPage], shared, {
        de: ui.de,
        en: { ...english, navigation: { ...english.navigation, about: '' } },
      }),
    /Incomplete UI/,
  );
  assert.throws(
    () =>
      make(
        [englishPage],
        shared.filter((entry) => entry.data.locale === 'de'),
      ),
    /Missing published shared reference/,
  );
  assert.doesNotThrow(() => make([page({ locale: 'en', publication: 'draft' })], []));
});
test('schema rejects invalid locales, metadata, paths and references', () => {
  for (const patch of [
    { locale: 'fr' },
    { title: '' },
    { description: undefined },
    { slug: '/About/' },
    { shared: ['missing'] },
    { hero: '/../secret.jpg' },
  ])
    assert.equal(pageSchema.safeParse({ ...german.data, ...patch }).success, false);
  assert.equal(pageSchema.parse({ ...german.data, slug: '/new/nested' }).slug, '/new/nested/');
});
test('footer settings enforce roles, complete legal references, uniqueness and no extra fields', () => {
  assert.deepEqual(footerNavigation, { primary: 'contact', legal: ['imprint', 'privacy'] });
  for (const footer of [
    {},
    { primary: 'imprint', legal: ['contact', 'privacy'] },
    { primary: 'contact', legal: ['imprint', 'imprint'] },
    { primary: 'contact', legal: ['privacy'] },
    { primary: 'contact', legal: ['imprint', 'privacy', 'privacy'] },
    { primary: 'contact', legal: ['imprint', 'unknown'] },
    { primary: 'contact', legal: ['imprint', 'privacy'], shared: [] },
    { primary: ['contact'], legal: 'privacy' },
  ])
    assert.equal(navigationSettingsSchema.safeParse({ footerNavigation: footer }).success, false);
  assert.equal(navigationSettingsSchema.safeParse({ footerNavigation, shared: [] }).success, false);
  assert.equal(
    pageSchema.safeParse({ ...german.data, shared: ['contact', 'imprint', 'privacy'] }).success,
    false,
  );
});
test('every configured footer destination must be published in the current locale', () => {
  for (const locale of ['de', 'en'] as const) {
    for (const key of [footerNavigation.primary, ...footerNavigation.legal]) {
      const otherEntries = shared.filter(
        (entry) => entry.data.locale !== locale || entry.data.translationKey !== key,
      );
      const missing = shared.find(
        (entry) => entry.data.locale === locale && entry.data.translationKey === key,
      )!;
      for (const dependencies of [
        otherEntries,
        [...otherEntries, { data: { ...missing.data, publication: 'draft' as const } }],
      ]) {
        assert.throws(
          () => make([german, englishPage], dependencies),
          new RegExp(`Missing published shared reference: ${key}:${locale}`),
        );
      }
    }
  }
});
test('footer hierarchy uses roles and localized UI, independently of labels and paths', () => {
  for (const locale of ['de', 'en'] as const) {
    const dictionary = {
      ...strings[locale]!,
      contact: 'Same label',
      imprint: 'Same label',
      privacy: 'Same label',
    };
    const model = navigationModel(make(), 'about', locale, dictionary);
    assert.deepEqual(model.footer.primary, {
      key: 'contact',
      href: `/${locale}/contact/`,
      label: 'Same label',
      current: false,
    });
    assert.deepEqual(
      model.footer.legal.map((link) => [link.key, link.href, link.label]),
      [
        ['imprint', `/${locale}/imprint/`, 'Same label'],
        ['privacy', `/${locale}/privacy/`, 'Same label'],
      ],
    );
    assert.equal(navigationModel(make(), 'contact', locale, dictionary).isUtility, true);
  }
});
test('navigation stays local and home is not invented', () => {
  const model = navigationModel(make(), 'about', 'en', english);
  assert.deepEqual(model.links, [{ href: '/about-susanne/', label: 'ABOUT', current: true }]);
  assert.deepEqual(model.languages, [{ locale: 'de', label: 'Deutsch', href: '/ueber-mich/' }]);
  assert.equal(model.home, undefined);
});
test('legacy aliases follow changed authored paths directly; canonical content wins', () => {
  const routes = make([german, page({ translationKey: 'home', slug: '/' })]);
  const aliases = createAliases(routes, legacyRoutes);
  assert.equal(aliases.find((alias) => alias.path === '/de/')?.destination, '/');
  assert.ok(!aliases.some((alias) => alias.path === '/' || alias.path === '/index.html'));
  assert.equal(
    aliases.find((alias) => alias.path === '/html/about.html')?.destination,
    '/ueber-mich/',
  );
  const moved = createAliases(make([page({ slug: '/neuer/pfad' })]), legacyRoutes);
  assert.equal(
    moved.find((alias) => alias.path === '/de/ueber-mich/')?.destination,
    '/neuer/pfad/',
  );
  const canonical = createAliases(
    make([german, page({ translationKey: 'other', slug: '/de/ueber-mich' })]),
    legacyRoutes,
  );
  assert.ok(!canonical.some((alias) => alias.path === '/de/ueber-mich/'));
});
