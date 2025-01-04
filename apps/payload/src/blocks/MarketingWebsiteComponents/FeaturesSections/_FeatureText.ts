import { Block } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { characterFormatFeatures } from '@/lexicalFeatures/Features'
import { ButtonFactory } from '@/blocks/SharedComponents/Buttons/Button'

export const _FeatureTextIntegrationIconBoxBlock: Block = {
  slug: '_FeatureTextIntegrationIconBox', // required
  imageURL: '/images/MarketingWebsiteComponents/FeatureSections/_FeatureTextIntegrationIconBox.png',
  imageAltText:
    'Image of feature section _Feature text integration icon box component from untitled UI 4.0',
  interfaceName: '_FeatureTextIntegrationIconBoxBlock', // optional
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
                    '/images/MarketingWebsiteComponents/FeatureSections/_FeatureTextIntegrationIconBoxButton.png',
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

export const _FeatureTextIconCardBlock: Block = {
  slug: '_FeatureTextIconCard', // required
  imageURL: '/images/MarketingWebsiteComponents/FeatureSections/_FeatureTextIconCard.png',
  imageAltText: 'Image of feature section _Feature text icon card component from untitled UI 4.0',
  interfaceName: '_FeatureTextIconCardBlock', // optional
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
                    '/images/MarketingWebsiteComponents/FeatureSections/_FeatureTextIconCardButton.png',
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
