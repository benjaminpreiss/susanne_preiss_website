import {
  component,
  defineMarkdocConfig,
  nodes,
  type AstroMarkdocConfig,
  Markdoc,
} from '@astrojs/markdoc/config';
import { editorialSchemas } from './src/lib/content/editorial';

const error = (message: string) => ({ id: 'editorial-invalid', level: 'error' as const, message });
const text = { type: String, required: true };
const optionalText = { type: String };
const identity = { key: text };
const imagePositions = {
  imagePosition: { type: String, default: 'center top' },
  mobileImagePosition: optionalText,
};
const homeControls = {
  tone: { type: String, matches: ['dark', 'light'], default: 'dark' },
  mobileMenuTone: { type: String, matches: ['dark', 'light'] },
  hideNavigation: { type: Boolean, default: false },
};
const media = {
  image: text,
  alt: text,
  side: { type: String, matches: ['left', 'right'], default: 'left' },
};
const definitions = {
  article: { file: 'Article', attributes: {} },
  'home-intro': {
    file: 'HomeIntro',
    attributes: { ...identity, image: text, alt: text, ...imagePositions, ...homeControls },
  },
  'home-tile': {
    file: 'HomeTile',
    attributes: {
      ...identity,
      ...media,
      destination: text,
      mobileImage: optionalText,
      ...homeControls,
      ...imagePositions,
      arrow: { type: String, matches: ['below', 'inline'], default: 'below' },
    },
  },
  prose: { file: 'Prose', attributes: identity },
  heading: { file: 'Heading', attributes: { ...identity, centered: { type: Boolean } } },
  'resource-list': { file: 'ResourceList', attributes: {} },
  resource: {
    file: 'Resource',
    attributes: { ...identity, destination: text, image: optionalText, alt: optionalText },
  },
  course: { file: 'Course', attributes: { ...identity, ...media, destination: text } },
  illustration: { file: 'Illustration', attributes: { ...identity, ...media } },
  video: {
    file: 'Video',
    attributes: {
      ...identity,
      id: text,
      src: text,
      poster: optionalText,
      title: text,
      cover: { type: String, matches: ['workshop', 'talk'], default: 'workshop' },
      coverImage: optionalText,
      mediaLocale: optionalText,
      captionSrc: optionalText,
      captionLocale: optionalText,
      captionLabel: optionalText,
      transcript: optionalText,
      transcriptLocale: optionalText,
    },
  },
  br: { file: 'Break', attributes: {} },
};
const tags: NonNullable<AstroMarkdocConfig['tags']> = {};
for (const [name, definition] of Object.entries(definitions)) {
  tags[name] = {
    render: component(`./src/components/editorial/${definition.file}.astro`),
    attributes: definition.attributes,
    inline: name === 'br',
    validate(node) {
      const schema = editorialSchemas[name as keyof typeof editorialSchemas];
      const result = schema.safeParse(node.attributes);
      return result.success
        ? []
        : result.error.issues.map((issue) =>
            error(`${name}: ${issue.path.join('.')}: ${issue.message}`),
          );
    },
  };
}

export default defineMarkdocConfig({
  tags,
  nodes: {
    document: {
      ...nodes.document,
      // Equivalent to documented render:null, which 2.0.9's Render type omits.
      render: component('./src/components/editorial/Document.astro'),
      async transform(node, config) {
        let imageOrder = 0;
        // Derive priority from authored order, not section keys or component identity.
        const children = await Promise.all(
          node.children.map(async (child) => {
            const order =
              child.tag === 'home-intro' || child.tag === 'home-tile' ? imageOrder++ : undefined;
            const rendered = await child.transform(config);
            if (order !== undefined) {
              for (const tag of [rendered].flat())
                if (Markdoc.Tag.isTag(tag)) tag.attributes.imageOrder = order;
            }
            return rendered;
          }),
        );
        return new Markdoc.Tag(config.nodes!.document!.render!, {}, children.flat());
      },
      validate(node) {
        const errors: ReturnType<typeof error>[] = [];
        const keys = new Set<string>();
        const fragments = new Set<string>();
        function visit(
          current: InstanceType<typeof Markdoc.Ast.Node>,
          parent?: InstanceType<typeof Markdoc.Ast.Node>,
          container?: string,
        ) {
          if (
            current.type === 'link' &&
            (container === 'resource' || container === 'course' || container === 'home-tile')
          )
            errors.push(error('Cards cannot contain nested links'));
          if (current.type === 'text' && /<\/?[a-z][^>]*>/i.test(current.attributes.content ?? ''))
            errors.push(error('HTML is not allowed; use Markdown or the br tag'));
          if (current.type === 'tag') {
            const name = current.tag ?? '';
            if (!Object.hasOwn(definitions, name))
              errors.push(error(`Unsupported editorial tag: ${name}`));
            if (
              name === 'resource'
                ? parent?.tag !== 'resource-list'
                : name !== 'br' && parent?.type !== 'document'
            ) {
              errors.push(error(`Invalid nesting for ${name}`));
            }
            if (
              name === 'resource-list' &&
              (!current.children.length ||
                current.children.some((child) => child.tag !== 'resource'))
            )
              errors.push(error('resource-list requires resource children only'));
            if (name === 'br' && (parent?.type !== 'inline' || current.children.length))
              errors.push(error('br must be an empty inline tag'));
            for (const [attribute, seen] of [
              ['key', keys],
              ['id', fragments],
            ] as const) {
              const value = current.attributes[attribute];
              if (typeof value === 'string') {
                if (seen.has(value))
                  errors.push(error(`Duplicate editorial ${attribute}: ${value}`));
                seen.add(value);
              }
            }
          }
          // No runtime variables/functions/partials: page-local content inherits its entry's locale/publication.
          for (const value of Object.values(current.attributes)) {
            if (value && typeof value === 'object')
              errors.push(error('Editorial attributes must be literal values'));
          }
          current.children.forEach((child) => visit(child, current, current.tag ?? container));
        }
        visit(node);
        return errors;
      },
    },
  },
});
