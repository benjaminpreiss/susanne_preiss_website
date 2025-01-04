import { Block } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { characterFormatFeatures } from '@/lexicalFeatures/Features'
import { _JobPostCard01Block } from './_JobPost'

export const CareersSectionCard01Block: Block = {
  slug: 'CareersSectionCard01', // required
  imageURL: '/images/MarketingWebsiteComponents/CareersSections/CareersSectionCard01.png',
  imageAltText: 'Image of careers section card 01 component from untitled UI 4.0',
  interfaceName: 'CareersSectionCard01Block', // optional
  fields: [
    // required
    {
      type: 'tabs',
      tabs: [
        {
          label: 'heading',
          fields: [
            {
              name: 'heading',
              required: true,
              type: 'richText',
              editor: lexicalEditor({
                features: () => characterFormatFeatures(),
              }),
              label: 'heading',
            },
          ],
        },
        {
          label: 'supportingText',
          fields: [
            {
              name: 'supportingText',
              required: false,
              type: 'richText',
              editor: lexicalEditor({
                features: () => characterFormatFeatures(),
              }),
              label: 'supportingText',
            },
          ],
        },
        {
          label: 'theme',
          fields: [
            {
              name: 'theme',
              type: 'radio',
              options: ['default', 'theme'],
              required: true,
              defaultValue: 'default',
            },
          ],
        },
        {
          label: 'horizontal tabs',
          fields: [
            {
              name: 'horizontalTabs',
              type: 'checkbox',
              defaultValue: false,
            },
          ],
        },
        {
          label: 'content',
          fields: [
            {
              name: 'content',
              type: 'blocks',
              blocks: [_JobPostCard01Block],
              minRows: 2,
              required: true,
            },
          ],
        },
      ],
    },
  ],
}
