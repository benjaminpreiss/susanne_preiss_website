import { Block } from 'payload'

export const Image: Block = {
  slug: 'Image', // required
  interfaceName: 'ImageBlock', // optional
  fields: [
    {
      name: 'image',
      relationTo: 'media',
      type: 'upload',
      required: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'horizontal',
          type: 'radio',
          required: true,
          options: ['left', 'center', 'right'],
          defaultValue: 'center',
        },
        {
          name: 'vertical',
          type: 'radio',
          required: true,
          options: ['top', 'center', 'right'],
          defaultValue: 'center',
        },
      ],
    },
  ],
}
