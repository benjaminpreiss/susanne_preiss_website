import upperFirst from 'lodash.upperfirst'
import { Block } from 'payload'

type IconsNames = keyof typeof import('@frontline-hq/untitledui-icons')

export const IconFactory = async () => {
  const imports = await import('@frontline-hq/untitledui-icons')
  Object.entries(imports).map(([k, v]) => ({
    slug: `Icon${upperFirst(k)}`, // required
    interfaceName: `Icon${upperFirst(k)}`, // optional
    fields: [
      // required
      { name: 'text', type: 'text', required: true },
      { name: 'supportingText', type: 'text', required: false },
    ],
  }))
}

export const Icon: Block = {
  slug: 'Icon', // required
  interfaceName: 'Icon', // optional
  fields: [
    // required
    { name: 'text', type: 'text', required: true },
    { name: 'supportingText', type: 'text', required: false },
  ],
}
