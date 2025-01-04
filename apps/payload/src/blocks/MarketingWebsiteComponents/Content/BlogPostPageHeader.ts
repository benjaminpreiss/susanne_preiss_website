import { Block } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { characterFormatFeatures } from '@/lexicalFeatures/Features'
import camelCase from 'lodash.camelcase'
import upperFirst from 'lodash.upperfirst'
import { Image } from '@/blocks/Helpers/Image'

const images = {
  BlogPostPageHeaderLargeImage02:
    '/images/MarketingWebsiteComponents/Content/BlogPostPageHeaderLargeImage02.png',
}

export const BlogPostPageHeaderFactory: ({ type }: { type: 'Large image 02' }) => Block = ({
  type,
}) => {
  const name = upperFirst(camelCase(`BlogPostPageHeader ${type}`))
  return {
    slug: name, // required
    imageURL: images[name as keyof typeof images],
    imageAltText: `Image of ${name} component from untitled UI 4.0`,
    interfaceName: `${name}Block`, // optional
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
            label: 'image',
            fields: [
              {
                name: 'image',
                type: 'blocks',
                blocks: [Image],
                required: true,
                minRows: 1,
                maxRows: 1,
              },
            ],
          },
        ],
      },
    ],
  }
}
