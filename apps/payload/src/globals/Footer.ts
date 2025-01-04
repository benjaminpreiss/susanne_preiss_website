import { characterFormatFeatures } from '@/lexicalFeatures/Features'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { GlobalConfig } from 'payload'

export const Footer: GlobalConfig = {
  slug: 'footer',
  fields: [
    {
      name: 'contactPageLink',
      required: true,
      type: 'richText',
      editor: lexicalEditor({
        features: () => characterFormatFeatures(),
      }),
      label: 'Contact Page Link',
    },
    {
      type: 'blocks',
      name: 'footer',
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
            { type: 'relationship', name: 'link', relationTo: ['pages'], required: true },
          ],
          slug: 'pagesLink',
        },
      ],
    },
  ],
}
