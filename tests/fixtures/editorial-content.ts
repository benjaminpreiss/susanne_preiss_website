import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { english } from './ui';

// Deliberately small, owned test content. Production prose, metadata and section
// counts must never be used as the expected output of a renderer test.
export async function seedEditorialContent(root: string) {
  const content = join(root, 'content');
  for (const kind of ['pages', 'shared']) {
    await rm(join(content, kind), { recursive: true, force: true });
    await mkdir(join(content, kind, 'de'), { recursive: true });
  }
  await cp(
    resolve('tests/fixtures/legacy-routes.json'),
    join(content, 'settings/legacy-routes.json'),
  );
  await writeFile(
    join(content, 'settings/navigation.json'),
    JSON.stringify({
      footerNavigation: { primary: 'contact', legal: ['imprint', 'privacy'] },
    }),
  );
  await writeFile(
    join(content, 'ui.json'),
    JSON.stringify({
      de: {
        ...english,
        contact: 'KONTAKT',
        imprint: 'IMPRESSUM',
        privacy: 'DATENSCHUTZ',
        language: 'Sprache',
      },
    }),
  );
  const pages = [
    ['home', 'home', '/'],
    ['about', 'about', '/ueber-mich'],
    ['workshops', 'workshops', '/workshops'],
    ['online', 'online-training', '/online-training'],
    ['personal', 'people-development', '/personalentwicklung'],
    ['changemaker', 'changemaker', '/regenerative-changemaker'],
    ['nachhaltigkeit', 'sustainability', '/nachhaltigkeit'],
    ['business', 'business-coaching', '/business-coaching'],
    ['sparring', 'executive-sparring', '/top-management-sparring'],
    ['speaker', 'speaking', '/key-note-speaker'],
    ['press', 'press', '/presse'],
  ];
  for (const [file, key, slug] of pages) {
    let body = `{% article %}\n\n# ${key === 'about' ? 'About' : `Fixture ${key}`}\n\nEditable fixture paragraph with **emphasis** and [a link](https://example.com).\n\n{% /article %}`;
    if (key === 'home')
      body = `
{% home-intro key="intro" image="/img/about_start_2.jpg" alt="Fixture portrait" imagePosition="right bottom" mobileImagePosition="left top" %}
# Fixture home
{% /home-intro %}
{% home-tile key="tile" destination="content:workshops" image="/img/about_start_2.jpg" mobileImage="/img/workshops_video2.jpg" alt="" tone="light" mobileMenuTone="dark" hideNavigation=true imagePosition="30% 70%" mobileImagePosition="20% 40%" arrow="inline" %}
## Fixture tile
Fixture supporting text
{% /home-tile %}
{% home-tile key="another-tile" destination="content:workshops" image="/img/about_start_2.jpg" alt="" tone="light" %}
## Another fixture tile
{% /home-tile %}`;
    if (key === 'changemaker')
      body += `
{% video key="fixture-video" id="fixture-video" title="Fixture video" src="https://example.com/fixture.m3u8" cover="talk" coverImage="/img/about_start_2.jpg" %}
## Fixture talk
{% /video %}`;
    if (key === 'workshops')
      body += `
{% prose key="testimonial" %}
## Fixture testimonial
A **quoted** paragraph.
{% /prose %}
{% heading key="course-heading" centered=true %}
## Fixture courses
{% /heading %}
{% course key="left-course" image="/img/about_start_2.jpg" alt="" destination="content:contact" side="left" %}
## Left course
{% /course %}
{% course key="right-course" image="/img/about_start_2.jpg" alt="" destination="https://example.com/course" side="right" %}
## Right course
{% /course %}
{% resource-list %}
{% resource key="document" destination="/pdf/online1.pdf" image="/svg/deep_3.svg" alt="" %}
## Fixture document
{% /resource %}
{% /resource-list %}
{% illustration key="diagram" image="/img/about_start_2.jpg" alt="Fixture diagram" side="right" /%}`;
    const metadata =
      key === 'business-coaching' || key === 'online-training'
        ? `structuredData:\n  type: ${key === 'business-coaching' ? 'Service' : 'Course'}\n  name: Fixture entity\n  description: An explicitly authored fixture description.\n`
        : '';
    const publication = key === 'home' ? 'published' : '"published"';
    await writeFile(
      join(content, `pages/de/${file}.mdoc`),
      `---
translationKey: ${key}
locale: "de"
publication: ${publication}
slug: "${slug}"
title: "${key === 'about' ? 'About Susanne Preiss' : `Fixture ${key}`}"
description: Fixture description for ${key}.
hero: /img/about_start_2.jpg
heroAlt: Fixture portrait
${metadata}---\n\n${body}\n`,
    );
  }
  for (const [key, slug] of [
    ['contact', '/kontakt'],
    ['imprint', '/impressum'],
    ['privacy', '/datenschutz'],
  ]) {
    await writeFile(
      join(content, `shared/de/${key}.mdoc`),
      `---
translationKey: ${key}
locale: de
publication: published
slug: ${slug}
title: Fixture ${key}
description: Fixture ${key} description.
---\n\n${key === 'contact' ? '' : `# Fixture ${key}\n\n`}Fixture utility content.\n`,
    );
  }
}
