import { Block } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { characterFormatFeatures } from '@/lexicalFeatures/Features'
import { HTMLAnchor } from '@/blocks/Helpers/Anchor'

export const ButtonFactory: ({
  functionality,
  icon,
  imageUrl,
}: {
  functionality: 'anchor'
  icon: 'default'
  imageUrl: string
}) => Block = ({ imageUrl }) => {
  return {
    slug: 'Button', // required
    imageURL: imageUrl,
    imageAltText: `Image of Button component from untitled UI 4.0`,
    interfaceName: `ButtonBlock`, // optional
    fields: [
      // required

      {
        type: 'tabs',
        tabs: [
          {
            label: 'text',
            fields: [
              {
                name: 'text',
                required: true,
                type: 'richText',
                editor: lexicalEditor({
                  features: () => characterFormatFeatures(),
                }),
                label: 'text',
              },
            ],
          },
          {
            label: 'functionality',
            fields: [
              {
                name: 'functionality',
                type: 'blocks',
                blocks: [HTMLAnchor],
                label: 'functionality',
                minRows: 1,
                maxRows: 1,
                required: true,
              },
            ],
          },
          {
            label: 'icons',
            fields: [
              {
                name: 'iconLeading',
                type: 'upload',
                relationTo: 'media',
                filterOptions: { mimeType: { contains: 'image/svg+xml' } },
              },
              {
                name: 'iconTrailing',
                type: 'upload',
                relationTo: 'media',
                filterOptions: { mimeType: { contains: 'image/svg+xml' } },
              },
            ],
          },
        ],
      },
    ],
  }
}
