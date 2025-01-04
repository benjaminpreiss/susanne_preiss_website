import { Block } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { characterFormatFeatures } from '@/lexicalFeatures/Features'
import { Image } from '@/blocks/Helpers/Image'
import { BadgeFactory } from '@/blocks/SharedComponents/Badges/Badge'

export const BlogPostCardSimple03Block: Block = {
  slug: 'BlogPostCardSimple03', // required
  imageURL: '/images/MarketingWebsiteComponents/BlogSections/BlogPostCardSimple03.png',
  imageAltText: 'Image of blog section blog post card simple 03 component from untitled UI 4.0',
  interfaceName: 'BlogPostCardSimple03Block', // optional
  fields: [
    // required
    {
      type: 'tabs',
      tabs: [
        {
          name: 'image',
          fields: [
            {
              type: 'blocks',
              blocks: [Image],
              name: 'image',
              required: true,
              minRows: 1,
              maxRows: 1,
            },
          ],
        },
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
            {
              name: 'icon',
              type: 'upload',
              relationTo: 'media',
              filterOptions: { mimeType: { contains: 'image/svg+xml' } },
              required: false,
            },
          ],
        },
        {
          label: 'supportingText',
          fields: [
            {
              name: 'supportingText',
              required: true,
              type: 'richText',
              editor: lexicalEditor({
                features: () => characterFormatFeatures(),
              }),
              label: 'supportingText',
            },
          ],
        },
        {
          label: 'author',
          fields: [
            {
              name: 'author',
              required: false,
              type: 'richText',
              editor: lexicalEditor({
                features: () => characterFormatFeatures(),
              }),
              label: 'author',
            },
          ],
        },
        {
          label: 'categories',
          fields: [
            {
              name: 'categories',
              required: false,
              type: 'blocks',
              blocks: [
                BadgeFactory({
                  imageUrl:
                    '/images/MarketingWebsiteComponents/BlogSections/BlogPostCardSimple03BadgeIconFalse.png',
                  functionality: 'anchor',
                  icon: 'false',
                }),
                BadgeFactory({
                  imageUrl:
                    '/images/MarketingWebsiteComponents/BlogSections/BlogPostCardSimple03BadgeIconLeading.png',
                  functionality: 'anchor',
                  icon: 'icon leading',
                }),
                BadgeFactory({
                  imageUrl:
                    '/images/MarketingWebsiteComponents/BlogSections/BlogPostCardSimple03BadgeIconTrailing.png',
                  functionality: 'anchor',
                  icon: 'icon trailing',
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
