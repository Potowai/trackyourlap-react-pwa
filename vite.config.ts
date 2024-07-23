import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
	plugins: [
		react(),
		tsconfigPaths(),
		VitePWA({
			registerType: 'autoUpdate',
			devOptions: {
				enabled: true
			},
			includeAssets: ['icons/512_trackyourlap.png', 'robots.txt'],
			manifest: {
				name: 'Track Your Lap',
				short_name: 'TrackYourLap',
				description: 'Track your laps and improve your performance.',
				theme_color: '#ffffff',
				background_color: '#ffffff',
				display: 'standalone',
				scope: '/',
				start_url: '/',
				icons: [
					{
						src: 'icons/192_trackyourlap.png',
						sizes: '192x192',
						type: 'image/png'
					},
					{
						src: 'icons/512_trackyourlap.png',
						sizes: '512x512',
						type: 'image/png'
					}
				]
			}
		})
	],
	server: {
		headers: {
			/* 'Cross-Origin-Opener-Policy': 'same-origin',
			'Cross-Origin-Embedder-Policy': 'require-corp'
		 */
		}
	}
})
