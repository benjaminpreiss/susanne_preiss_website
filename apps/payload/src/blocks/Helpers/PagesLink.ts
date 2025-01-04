import { characterFormatFeatures } from '@/lexicalFeatures/Features'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { Block } from 'payload'

export const PagesLink: Block = {
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
}
