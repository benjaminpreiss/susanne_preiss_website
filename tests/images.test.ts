import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { load } from 'cheerio';
import sharp from 'sharp';

async function htmlFiles(dir: string): Promise<string[]> {
  return (
    await Promise.all(
      (await readdir(dir, { withFileTypes: true })).map((entry) =>
        entry.isDirectory()
          ? htmlFiles(join(dir, entry.name))
          : entry.name.endsWith('.html')
            ? [join(dir, entry.name)]
            : [],
      ),
    )
  ).flat();
}
test('production pictures negotiate modern formats, bounded candidates and conventional fallbacks', async () => {
  let pictures = 0;
  const checked = new Set<string>();
  for (const file of await htmlFiles('dist')) {
    const $ = load(await readFile(file, 'utf8'));
    assert.equal($('main img[src^="/img/"]').length, 0);
    for (const picture of $('picture.responsive-image').toArray()) {
      pictures++;
      const node = $(picture),
        img = node.find('img');
      assert.equal(img.length, 1);
      assert.notEqual(img.attr('alt'), undefined);
      assert.ok(Number(img.attr('width')) > 0 && Number(img.attr('height')) > 0);
      assert.ok(img.attr('sizes'));
      assert.match(img.attr('src')!, /^\/_astro\/.*\.(jpg|png)$/);
      assert.deepEqual(
        node
          .find('source:not([media])')
          .toArray()
          .map((el) => $(el).attr('type')),
        ['image/avif', 'image/webp'],
      );
      const media = node.find('source[media]');
      if (media.length)
        assert.deepEqual(
          media.toArray().map((el) => $(el).attr('type')),
          ['image/avif', 'image/webp', 'image/jpeg'],
        );
      for (const el of node.find('[srcset]').toArray()) {
        const candidates = $(el)
          .attr('srcset')!
          .split(',')
          .map((candidate) => candidate.trim().split(/\s+/));
        assert.ok(candidates.length >= 1 && candidates.length <= 7);
        assert.equal($(el).attr('sizes'), img.attr('sizes'));
        for (const [url, descriptor] of candidates) {
          assert.ok(url && descriptor);
          assert.match(descriptor, /^\d+w$/);
          const width = Number(descriptor.slice(0, -1));
          assert.ok(width <= 1920);
          if (checked.has(url)) continue;
          checked.add(url);
          const meta = await sharp(await readFile(`dist${url}`)).metadata();
          assert.equal(meta.width, width);
          const basename = url.split('/').at(-1)!.split('.')[0];
          const original = (await readdir('src/assets/images')).find(
            (name) => name.split('.')[0] === basename,
          )!;
          assert.ok(width <= (await sharp(`src/assets/images/${original}`).metadata()).width!);
          const type = $(el).attr('type');
          if (type) assert.equal(meta.format, type === 'image/avif' ? 'heif' : type.slice(6));
        }
      }
      const homeIndex = $('.home-image img').toArray().indexOf(img.get(0)!);
      const isLcp = img.closest('.hero').length > 0 || homeIndex === 0;
      assert.equal(img.attr('loading'), isLcp || homeIndex === 1 ? 'eager' : 'lazy');
      if (isLcp) assert.equal(img.attr('fetchpriority'), 'high');
    }
    for (const el of $('video[poster]').toArray()) {
      const poster = $(el).attr('poster')!;
      assert.match(poster, /^\/_astro\/.*\.(jpg|png)$/);
      assert.ok((await sharp(await readFile(`dist${poster}`)).metadata()).width! <= 1280);
    }
  }
  assert.ok(pictures > 0, 'No responsive images were checked');
});
