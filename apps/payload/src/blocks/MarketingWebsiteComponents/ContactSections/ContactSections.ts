import { Block } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { characterFormatFeatures } from '@/lexicalFeatures/Features'
import { _ContactTextIconCardBlock } from './_ContactText'

export const ContactSectionIconCards02Block: Block = {
  slug: 'ContactSectionIconCards02', // required
  imageURL: '/images/MarketingWebsiteComponents/ContactSections/ContactSectionIconCards02.png',
  imageAltText: 'Image of contact section icon cards 02 component from untitled UI 4.0',
  interfaceName: 'ContactSectionIconCards02Block', // optional
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
          label: 'subheading',
          fields: [
            {
              name: 'subheading',
              required: false,
              type: 'richText',
              editor: lexicalEditor({
                features: () => characterFormatFeatures(),
              }),
              label: 'subheading',
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
          label: 'content',
          fields: [
            {
              name: 'content',
              type: 'blocks',
              blocks: [_ContactTextIconCardBlock],
              minRows: 2,
              required: true,
            },
          ],
        },
      ],
    },
  ],
}
