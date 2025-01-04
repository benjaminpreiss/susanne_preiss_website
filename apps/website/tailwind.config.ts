import type { Config } from 'tailwindcss';

export default {
	content: ['./src/**/*.{html,js,svelte,ts,json}'],

	theme: {
		extend: {
			screens: {
				aspect1: { raw: '(max-aspect-ratio: 1/1)' },
				coarsePointer: { raw: '(pointer: coarse)' },
				maxHeight500: { raw: '(max-height: 500px' }
			},
			fontFamily: {
				'cormorant-garamond': ['"Cormorant Garamond"', 'serif'],
				'open-sans': ['"Open Sans"', 'sans-serif']
			}
		}
	},

	plugins: []
} satisfies Config;
