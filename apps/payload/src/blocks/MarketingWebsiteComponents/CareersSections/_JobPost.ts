import { Block } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { characterFormatFeatures } from '@/lexicalFeatures/Features'
import { ButtonFactory } from '@/blocks/SharedComponents/Buttons/Button'
import { BadgeFactory } from '@/blocks/SharedComponents/Badges/Badge'

export const _JobPostCard01Block: Block = {
  slug: '_JobPostCard01', // required
  imageURL: '/images/MarketingWebsiteComponents/CareersSections/_JobPostCard01.png',
  imageAltText: 'Image of careers section Job Post Card 01 component from untitled UI 4.0',
  interfaceName: '_JobPostCard01Block', // optional
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
          label: 'category',
          fields: [
            {
              name: 'category',
              required: false,
              type: 'richText',
              editor: lexicalEditor({
                features: () => characterFormatFeatures(),
              }),
              label: 'category',
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
          label: 'badge',
          fields: [
            {
              name: 'badge',
              required: false,
              type: 'blocks',
              blocks: [
                BadgeFactory({
                  imageUrl:
                    '/images/MarketingWebsiteComponents/CareersSections/_JobPostCard01Badge.png',
                  functionality: 'anchor',
                  icon: 'dot',
                }),
              ],
              minRows: 0,
              maxRows: 1,
            },
          ],
        },
        {
          label: 'details',
          fields: [
            {
              type: 'blocks',
              blocks: [
                {
                  slug: 'detail',
                  fields: [
                    {
                      name: 'icon',
                      type: 'upload',
                      relationTo: 'media',
                      filterOptions: { mimeType: { contains: 'image/svg+xml' } },
                      required: true,
                    },
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
              ],
              name: 'details',
              minRows: 0,
              required: false,
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
                    '/images/MarketingWebsiteComponents/CareersSections/_JobPostCard01Button.png',
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
