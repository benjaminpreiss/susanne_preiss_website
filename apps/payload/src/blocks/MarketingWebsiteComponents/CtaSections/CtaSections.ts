import { Block } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { characterFormatFeatures } from '@/lexicalFeatures/Features'
import { Image } from '@/blocks/Helpers/Image'
import { ButtonFactory } from '@/blocks/SharedComponents/Buttons/Button'
import camelCase from 'lodash.camelcase'
import upperFirst from 'lodash.upperfirst'

const images = {
  CtaSectionCustom01: '/images/MarketingWebsiteComponents/CtaSections/CtaSectionCustom01.png',
  CtaSectionCustom02: '/images/MarketingWebsiteComponents/CtaSections/CtaSectionCustom02.png',
}

export const CtaSectionFactory: ({ type }: { type: 'Custom 01' | 'Custom 02' }) => Block = ({
  type,
}) => {
  const name = upperFirst(camelCase(`CtaSection ${type}`))
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
          {
            label: 'actions',
            fields: [
              {
                name: 'actions',
                type: 'blocks',
                blocks: [
                  ButtonFactory({
                    imageUrl:
                      '/images/MarketingWebsiteComponents/CtaSections/CtaSectionCustomButton.png',
                    functionality: 'anchor',
                    icon: 'default',
                  }),
                ],
                maxRows: 2,
              },
            ],
          },
        ],
      },
    ],
  }
}
