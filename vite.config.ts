import { sentrySvelteKit } from '@sentry/sveltekit';
import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import { wuchale } from 'wuchale/vite';
import { playwright } from '@vitest/browser-playwright';

import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
	server: {
		allowedHosts: [
			'belcoda.com',
			'staging.belcoda.com',
			'app.belcoda.com',
			'zero.staging.belcoda.com',
			'zero.app.belcoda.com',
			'localhost:5173',
			'.belcoda.com',
			...(process.env.PUBLIC_NGROK_DOMAIN ? [process.env.PUBLIC_NGROK_DOMAIN] : [])
		]
	},
	resolve: {
		alias: {
			'@noble/ciphers': path.resolve(
				__dirname,
				'node_modules/better-auth/node_modules/@noble/ciphers'
			)
		}
	},
	ssr: {
		// The @tryghost/kg-lexical-html-renderer chain mixes ESM with extensionless
		// imports (e.g. `lodash/cloneDeep`) that Node's strict ESM resolver rejects, and
		// CJS @lexical@0.13 packages that use `require` / named exports. Pre-bundling it
		// with esbuild via optimizeDeps converts the whole subtree into clean ESM.
		noExternal: ['@tryghost/kg-lexical-html-renderer'],
		optimizeDeps: {
			include: ['@tryghost/kg-lexical-html-renderer'],
			// jsdom (a transitive dep of the renderer) relies on the CJS `__dirname`
			// global to locate its own files (e.g. default-stylesheet.css), so it can't
			// be bundled into ESM. Keep it external so Node loads it natively.
			exclude: ['jsdom']
		}
	},
	plugins: [
		sentrySvelteKit({
			org: 'belcoda',
			project: 'belcoda',
			authToken: process.env.SENTRY_AUTH_TOKEN
		}),
		sveltekit(),
		tailwindcss(),
		wuchale({ configPath: 'wuchale.config.js' }),
		devtoolsJson()
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					environment: 'browser',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium' }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**'],
					setupFiles: ['./vitest-setup-client.ts']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
