import { Image } from '@/blocks/Helpers/Image'
import { characterFormatFeatures } from '@/lexicalFeatures/Features'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { GlobalConfig } from 'payload'

export const HomePage: GlobalConfig = {
  slug: 'homepage',
  fields: [
    {
      type: 'blocks',
      name: 'sections',
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
            {
              type: 'blocks',
              blocks: [Image],
              name: 'image',
              minRows: 1,
              maxRows: 1,
              required: true,
            },
            { type: 'relationship', name: 'link', relationTo: 'pages', required: true },
          ],
          slug: 'homepagePageLink',
        },
      ],
    },
  ],
}
