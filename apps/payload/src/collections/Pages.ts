import { BlogSectionSplitLayout01Block } from '@/blocks/MarketingWebsiteComponents/BlogSections/BlogSection'
import { CareersSectionCard01Block } from '@/blocks/MarketingWebsiteComponents/CareersSections/CareersSection'
import { ContactSectionIconCards02Block } from '@/blocks/MarketingWebsiteComponents/ContactSections/ContactSections'
import { BlogPostPageHeaderFactory } from '@/blocks/MarketingWebsiteComponents/Content/BlogPostPageHeader'
import { CtaSectionFactory } from '@/blocks/MarketingWebsiteComponents/CtaSections/CtaSections'
import {
  FeatureSectionIconCards02Block,
  FeatureSectionIntegrationsIcons04Block,
} from '@/blocks/MarketingWebsiteComponents/FeaturesSections/FeaturesSections'
import { proseFormatFeatures } from '@/lexicalFeatures/Features'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import type { CollectionConfig } from 'payload'

export const Pages: CollectionConfig = {
  slug: 'pages',
  fields: [
    { type: 'text', name: 'textSlug', required: true },
    {
      type: 'blocks',
      name: 'header',
      blocks: [BlogPostPageHeaderFactory({ type: 'Large image 02' })],
      required: true,
      minRows: 1,
      maxRows: 1,
    },
    {
      type: 'richText',
      name: 'Content',
      required: true,
      editor: lexicalEditor({
        features: () =>
          proseFormatFeatures({
            blocks: [
              ContactSectionIconCards02Block,
              FeatureSectionIntegrationsIcons04Block,
              FeatureSectionIconCards02Block,
              BlogSectionSplitLayout01Block,
              CtaSectionFactory({ type: 'Custom 01' }),
              CtaSectionFactory({ type: 'Custom 02' }),
              CareersSectionCard01Block,
            ],
          }),
      }),
    },
  ],
}
