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
	plugins: [
		sentrySvelteKit({
			org: 'belcoda',
			project: 'belcoda-belcoda-prod',
			authToken: process.env.SENTRY_AUTH_TOKEN
		}),
		sveltekit(),
		tailwindcss(),
		wuchale('wuchale.config.js'),
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
