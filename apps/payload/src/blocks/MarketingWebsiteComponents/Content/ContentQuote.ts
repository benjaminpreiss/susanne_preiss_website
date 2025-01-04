import { Block } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { characterFormatFeatures } from '@/lexicalFeatures/Features'
import { AvatarLabelGroup } from '@/blocks/SharedComponents/Avatars/AvatarLabelGroup'

const ContentAttributionBlock: Block = {
  slug: 'ContentAttribution', // required
  imageURL: '/images/MarketingWebsiteComponents/Content/ContentQuoteAttribution.png',
  imageAltText: 'Image of attribution in content quote block component from untitled UI 4.0',
  interfaceName: 'ContentAttributionBlock', // optional
  fields: [
    // required
    { name: 'text', type: 'text', required: true },
    { name: 'prependDash', type: 'checkbox', defaultValue: true },
  ],
}

export const ContentQuoteBlock: Block = {
  slug: 'ContentQuote',
  imageURL: '/images/MarketingWebsiteComponents/Content/ContentQuote.png',
  imageAltText: 'Image of content quote block component from untitled UI 4.0',
  interfaceName: 'ContentQuoteBlock', // optional
  fields: [
    {
      name: 'positioning',
      type: 'radio',
      required: true,
      options: ['left', 'center'],
      defaultValue: 'left',
    },
    {
      name: 'size',
      type: 'radio',
      required: true,
      options: ['sm', 'md', 'lg', 'xl', '2xl'],
      defaultValue: 'sm',
    },
    {
      name: 'text',
      type: 'richText',
      editor: lexicalEditor({
        features: () => characterFormatFeatures(),
      }),
      required: false,
    },
    {
      type: 'blocks',
      name: 'author',
      blocks: [AvatarLabelGroup],
      minRows: 0,
      maxRows: 1,
    },
    {
      type: 'blocks',
      name: 'attribution',
      blocks: [ContentAttributionBlock],
      minRows: 0,
      maxRows: 1,
    },
  ],
}
