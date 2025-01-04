import { Block } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { characterFormatFeatures } from '@/lexicalFeatures/Features'
import { _FeatureTextIconCardBlock, _FeatureTextIntegrationIconBoxBlock } from './_FeatureText'

export const FeatureSectionIntegrationsIcons04Block: Block = {
  slug: 'FeatureSectionIntegrationsIcons04', // required
  imageURL: '/images/MarketingWebsiteComponents/FeatureSections/IntegrationsIcons04.png',
  imageAltText: 'Image of feature section integrations icons 04 component from untitled UI 4.0',
  interfaceName: 'FeatureSectionIntegrationsIcons04Block', // optional
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
              blocks: [_FeatureTextIntegrationIconBoxBlock],
              minRows: 2,
              required: true,
            },
          ],
        },
      ],
    },
  ],
}

export const FeatureSectionIconCards02Block: Block = {
  slug: 'FeatureSectionIconCards02', // required
  imageURL: '/images/MarketingWebsiteComponents/FeatureSections/IconCards02.png',
  imageAltText: 'Image of feature section icon cards 02 component from untitled UI 4.0',
  interfaceName: 'FeatureSectionIconCards02Block', // optional
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
              blocks: [_FeatureTextIconCardBlock],
              minRows: 2,
              required: true,
            },
          ],
        },
      ],
    },
  ],
}
