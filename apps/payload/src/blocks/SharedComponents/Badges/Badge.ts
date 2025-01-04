import { Block, Tab } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { characterFormatFeatures } from '@/lexicalFeatures/Features'
import { HTMLAnchor } from '@/blocks/Helpers/Anchor'
import camelCase from 'lodash.camelcase'
import upperFirst from 'lodash.upperfirst'

export const BadgeFactory: ({
  functionality,
  icon,
  imageUrl,
}: {
  functionality: 'anchor'
  icon:
    | 'icon trailing'
    | 'icon leading'
    | 'only'
    | 'avatar'
    | 'x close'
    | 'country'
    | 'dot'
    | 'false'
  imageUrl: string
}) => Block = ({ icon, imageUrl }) => {
  const name = upperFirst(camelCase(`Badge Icon ${icon}`))
  return {
    slug: name, // required
    imageURL: imageUrl,
    imageAltText: `Image of ${name} component from untitled UI 4.0`,
    interfaceName: `${name}Block`, // optional
    fields: [
      // required
      {
        type: 'tabs',
        tabs: [
          ...((icon === 'only'
            ? []
            : [
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
              ]) as Tab[]),
          {
            label: 'functionality',
            fields: [
              {
                name: 'functionality',
                type: 'blocks',
                blocks: [HTMLAnchor],
                label: 'functionality',
                minRows: 0,
                maxRows: 1,
                required: false,
              },
            ],
          },
          {
            label: 'color',
            fields: [
              {
                name: 'color',
                type: 'select',
                options: [
                  'gray',
                  'brand',
                  'error',
                  'warning',
                  'success',
                  'blue light',
                  'blue',
                  'indigo',
                  'purple',
                  'pink',
                  'orange',
                  'blue gray',
                  'gray blue',
                ],
                defaultValue: 'brand',
                required: true,
              },
            ],
          },
          ...((icon === 'icon leading' ||
          icon === 'icon trailing' ||
          icon === 'avatar' ||
          icon === 'country' ||
          icon === 'only'
            ? [
                {
                  label: 'icon',
                  fields: [
                    {
                      name: 'icon',
                      type: 'upload',
                      relationTo: 'media',
                      filterOptions: { mimeType: { contains: 'image/svg+xml' } },
                    },
                  ],
                },
              ]
            : []) as Tab[]),
        ],
      },
    ],
  }
}
