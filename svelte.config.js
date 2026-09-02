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
					'https://www.googletagmanager.com', // Google Tag Manager / gtag.js bootstrap
					'https://cloud.umami.is', // Umami Cloud analytics script
					'https://connect.facebook.net', // Facebook SDK for WhatsApp embedded signup
					'https://app.cal.com' // Cal.com booking widget scripts
				],
				'style-src': ["'self'", "'unsafe-inline'"],
				'img-src': [
					"'self'",
					'data:',
					'blob:',
					'https:', // Externally hosted images in rich-text descriptions (URL insert)
					'https://*.amazonaws.com', // S3-hosted media and uploads
					'https://picsum.photos' // Placeholder/demo images
				],
				'media-src': [
					"'self'",
					'blob:',
					'https://*.amazonaws.com' // S3-hosted WhatsApp audio/video
				],
				'connect-src': [
					"'self'",
					'https://*.ingest.sentry.io', // Sentry error/event ingestion API
					'https://*.ingest.de.sentry.io', // Sentry error/event ingestion API (EU region)
					'https://www.google-analytics.com', // Google Analytics measurement endpoint
					'https://analytics.google.com', // GA4 / gtag collection endpoint
					'https://www.googletagmanager.com', // gtag.js measurement and conversion beacons
					'https://www.google.com', // Google Ads conversion and gtag /g/collect
					'https://www.googleadservices.com', // Google Ads conversion linker
					'https://googleads.g.doubleclick.net', // Google Ads conversion pixels
					'https://pagead2.googlesyndication.com', // Google Ads remarketing / conversion
					'https://cloud.umami.is', // Umami Cloud script host
					'https://api-gateway.umami.dev', // Umami Cloud event ingestion API
					'https://*.s3.amazonaws.com', // Global S3 endpoint (left-most wildcard is valid)
					'https://api.country.is', // IP geolocation during new organization creation
					'https://api.mapbox.com', // Mapbox styles, tiles, sprites, glyphs
					'https://events.mapbox.com', // Mapbox GL JS telemetry
					'https://*.t3.storage.dev', // Tigris object storage direct browser PUT uploads (virtual-hosted style: bucket is the left-most label)
					'https://t3.storage.dev', // Tigris object storage apex (path-style uploads: bucket is the first path segment)
					'https://api.country.is' // IP geolocation during new organization creation
					// Regional S3 upload host and Zero sync added at runtime in hooks.server.ts
				],
				'worker-src': [
					"'self'",
					'blob:' // Mapbox GL JS creates its web workers from blob: URLs
				],
				'frame-src': [
					'https://www.youtube.com', // Embedded YouTube videos
					'https://app.cal.com', // Cal.com inline booking iframe
					'https://www.facebook.com' // Facebook OAuth/embedded signup dialogs
				],
				// Relaxed to * for public embed pages (?layout=embed) in hooks.server.ts
				'frame-ancestors': ["'self'"],
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
