import { Block } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { characterFormatFeatures } from '@/lexicalFeatures/Features'
import { BlogPostCardSimple03Block } from './BlogPostCard'
import { ButtonFactory } from '@/blocks/SharedComponents/Buttons/Button'

export const BlogSectionSplitLayout01Block: Block = {
  slug: 'BlogSectionSplitLayout01', // required
  imageURL: '/images/MarketingWebsiteComponents/BlogSections/BlogSectionSplitLayout01.png',
  imageAltText: 'Image of blog section split layout 02 component from untitled UI 4.0',
  interfaceName: 'BlogSectionSplitLayout01Block', // optional
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
          label: 'button',
          fields: [
            {
              name: 'button',
              required: false,
              type: 'blocks',
              blocks: [
                ButtonFactory({
                  imageUrl:
                    '/images/MarketingWebsiteComponents/BlogSections/BlogSectionSplitLayout01Button.png',
                  functionality: 'anchor',
                  icon: 'default',
                }),
              ],
              minRows: 0,
              maxRows: 1,
            },
          ],
        },
        {
          label: 'content',
          fields: [
            {
              name: 'content',
              type: 'blocks',
              blocks: [BlogPostCardSimple03Block],
              minRows: 2,
              required: true,
            },
          ],
        },
      ],
    },
  ],
}
