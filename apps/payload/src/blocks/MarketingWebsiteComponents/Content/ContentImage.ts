import { Block } from 'payload'
import { paragraphFormatFeatures } from '@/lexicalFeatures/Features'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const ContentImageBlock: Block = {
  slug: 'Image', // required
  imageURL: '/images/MarketingWebsiteComponents/Content/ContentImage.png',
  imageAltText: 'Image of Content Image component from untitled UI 4.0',
  interfaceName: 'ImageBlock', // optional
  fields: [
    // required
    {
      name: 'image',
      relationTo: 'media',
      type: 'upload',
      required: true,
    },
    {
      type: 'tabs',
      tabs: [
        {
          name: 'aspectRatio',
          fields: [
            {
              name: 'aspectRatio',
              type: 'radio',
              required: true,
              options: ['landscape', 'square', 'portrait'],
              defaultValue: 'landscape',
            },
          ],
        },
        {
          name: 'positioning',
          fields: [
            {
              name: 'horizontal',
              type: 'radio',
              required: true,
              options: ['left', 'center', 'right'],
              defaultValue: 'center',
            },
            {
              name: 'vertical',
              type: 'radio',
              required: true,
              options: ['top', 'center', 'right'],
              defaultValue: 'center',
            },
          ],
        },
        {
          name: 'caption',
          fields: [
            {
              name: 'text',
              type: 'richText',
              editor: lexicalEditor({
                features: () => paragraphFormatFeatures(),
              }),
              required: false,
            },
            { name: 'hasLinkIcon', type: 'checkbox', defaultValue: true },
          ],
        },
      ],
    },
  ],
}
