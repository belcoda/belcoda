import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		csp: {
			mode: 'auto',
			directives: {
				'default-src': ["'self'"],
				'script-src': [
					"'self'",
					'https://www.googletagmanager.com', // Google Tag Manager bootstrap script
					'https://connect.facebook.net', // Facebook SDK for WhatsApp embedded signup
					'https://app.cal.com' // Cal.com booking widget scripts
				],
				'style-src': ["'self'", "'unsafe-inline'"],
				'img-src': [
					"'self'",
					'data:',
					'blob:',
					'https://*.amazonaws.com', // S3-hosted media and uploads
					'https://picsum.photos' // Placeholder/demo images
				],
				'connect-src': [
					"'self'",
					'https://*.ingest.sentry.io', // Sentry error/event ingestion API
					'https://www.google-analytics.com' // Google Analytics measurement endpoint
					// Zero sync host added at runtime in hooks.server.ts (PUBLIC_ZERO_SERVER)
				],
				'frame-src': [
					'https://www.youtube.com', // Embedded YouTube videos
					'https://app.cal.com', // Cal.com inline booking iframe
					'https://www.facebook.com' // Facebook OAuth/embedded signup dialogs
				],
				'frame-ancestors': ['*'],
				'font-src': ["'self'"],
				'object-src': ["'none'"],
				'base-uri': ["'self'"],
				'form-action': ["'self'"]
			}
		},

		version: {
			pollInterval: 60_000
		},

		experimental: {
			tracing: {
				server: true
			},

			instrumentation: {
				server: true
			}
		}
	}
};

export default config;
