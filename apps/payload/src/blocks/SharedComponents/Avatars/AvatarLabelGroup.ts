import { Block } from 'payload'

export const AvatarLabelGroup: Block = {
  slug: 'ContentAvatarAndText', // required
  imageURL: '/images/SharedComponents/Avatars/Avatars.png',
  imageAltText: 'Image of Avatar Label Group component from untitled UI 4.0',
  interfaceName: 'AvatarLabelGroup', // optional
  fields: [
    // required
    {
      name: 'image',
      relationTo: 'media',
      type: 'upload',
      required: true,
    },
    { name: 'text', type: 'text', required: true },
    { name: 'supportingText', type: 'text', required: false },
  ],
}
