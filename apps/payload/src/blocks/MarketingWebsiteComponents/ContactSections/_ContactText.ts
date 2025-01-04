import { Block } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { characterFormatFeatures } from '@/lexicalFeatures/Features'
import { ButtonFactory } from '@/blocks/SharedComponents/Buttons/Button'

export const _ContactTextIconCardBlock: Block = {
  slug: '_ContactTextIconCard', // required
  imageURL: '/images/MarketingWebsiteComponents/ContactSections/_ContactTextIconCard.png',
  imageAltText: 'Image of contact section _Contact text icon card component from untitled UI 4.0',
  interfaceName: '_ContactTextIconCardBlock', // optional
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
          label: 'icon',
          fields: [
            {
              name: 'icon',
              type: 'upload',
              relationTo: 'media',
              filterOptions: { mimeType: { contains: 'image/svg+xml' } },
              required: true,
            },
          ],
        },
        {
          label: 'button',
          fields: [
            {
              name: 'button',
              required: false,
              type: 'blocks',
              blocks: [
                ButtonFactory({
                  imageUrl:
                    '/images/MarketingWebsiteComponents/ContactSections/_ContactTextIconCardButton.png',
                  functionality: 'anchor',
                  icon: 'default',
                }),
              ],
              minRows: 0,
              maxRows: 1,
            },
          ],
        },
      ],
    },
  ],
}
