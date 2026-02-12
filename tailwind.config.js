/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				bg: '#0a0c0e',
				surface: '#12181c',
				'surface-hover': '#1a2228',
				border: '#2a343c',
				'border-light': '#3a4550',
				'text-primary': '#e8ecf0',
				'text-dim': '#8a96a4',
				'text-muted': '#6b7886',
				accent: '#06b6d4',
				danger: '#ff4444',
				success: '#22c55e',
				warning: '#eab308',
				info: '#3b82f6'
			},
			fontFamily: {
				display: ['Syne', 'system-ui', 'sans-serif'],
				body: ['IBM Plex Mono', 'SF Mono', 'Monaco', 'monospace'],
				mono: ['IBM Plex Mono', 'SF Mono', 'Monaco', 'monospace']
			},
			fontSize: {
				'2xs': '0.65rem'
			},
			animation: {
				shimmer: 'shimmer 1.5s infinite'
			},
			keyframes: {
				shimmer: {
					'0%': { backgroundPosition: '-200% 0' },
					'100%': { backgroundPosition: '200% 0' }
				}
			}
		}
	},
	plugins: []
};
