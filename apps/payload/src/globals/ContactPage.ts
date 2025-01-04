import { ButtonFactory } from '@/blocks/SharedComponents/Buttons/Button'
import { GlobalConfig } from 'payload'

export const ContactPage: GlobalConfig = {
  slug: 'contactPage',
  fields: [
    {
      type: 'blocks',
      name: 'links',
      blocks: [
        ButtonFactory({
          imageUrl: '/images/ContactPageButton.png',
          icon: 'default',
          functionality: 'anchor',
        }),
      ],
      required: true,
    },
  ],
}
