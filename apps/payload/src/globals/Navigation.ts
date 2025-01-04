import { characterFormatFeatures } from '@/lexicalFeatures/Features'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { GlobalConfig } from 'payload'

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  fields: [
    {
      type: 'blocks',
      name: 'navigation',
      blocks: [
        {
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
            { type: 'relationship', name: 'link', relationTo: 'pages', required: true },
          ],
          slug: 'pagesLink',
        },
      ],
    },
  ],
}
