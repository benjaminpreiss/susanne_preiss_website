import {
  AlignFeature,
  BlocksFeature,
  BoldFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  IndentFeature,
  InlineCodeFeature,
  InlineToolbarFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  StrikethroughFeature,
  SubscriptFeature,
  SuperscriptFeature,
  UnderlineFeature,
  UnorderedListFeature,
} from '@payloadcms/richtext-lexical'

import { ContentQuoteBlock } from '@/blocks/MarketingWebsiteComponents/Content/ContentQuote'
import { ContentImageBlock } from '@/blocks/MarketingWebsiteComponents/Content/ContentImage'
import { Block } from 'payload'

export const characterFormatFeatures = () => [
  InlineToolbarFeature(),
  SuperscriptFeature(),
  SubscriptFeature(),
  StrikethroughFeature(),
  UnderlineFeature(),
  BoldFeature(),
  ItalicFeature(),
  InlineCodeFeature(),
  LinkFeature(),
]

export const paragraphFormatFeatures = () => [
  ...characterFormatFeatures(),
  ParagraphFeature(),
  AlignFeature(),
  IndentFeature(),
  OrderedListFeature(),
  UnorderedListFeature(),
]

export const proseFormatFeatures = ({ blocks }: { blocks?: Block[] } = {}) => [
  ...paragraphFormatFeatures(),
  HeadingFeature(),
  HorizontalRuleFeature(),
  BlocksFeature({
    blocks: [...(blocks ?? []), ContentImageBlock, ContentQuoteBlock],
  }),
]
