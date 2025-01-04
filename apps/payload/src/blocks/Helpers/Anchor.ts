import { characterFormatFeatures } from '@/lexicalFeatures/Features'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { Block } from 'payload'

export const HTMLAnchor: Block = {
  slug: 'HTMLAnchor', // required
  interfaceName: 'HTMLAnchor', // optional
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
      type: 'row',
      fields: [
        {
          name: 'href',
          type: 'text',
          required: true,
        },
        {
          name: 'target',
          type: 'radio',
          required: true,
          options: ['_self', '_blank', '_parent', '_top', '_unfencedTop'],
          defaultValue: '_self',
        },
      ],
    },
  ],
}
