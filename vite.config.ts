import { sentrySvelteKit } from '@sentry/sveltekit';
import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import { wuchale } from 'wuchale/vite';
import { playwright } from '@vitest/browser-playwright';

import dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
	build: {
		cssMinify: 'esbuild'
	},
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
	ssr: {
		// The @tryghost/kg-lexical-html-renderer chain mixes ESM with extensionless
		// imports (e.g. `lodash/cloneDeep`) that Node's strict ESM resolver rejects, and
		// CJS @lexical@0.13 packages that use `require` / named exports. Pre-bundling it
		// with esbuild via optimizeDeps converts the whole subtree into clean ESM.
		// The whole @tryghost scope must be inlined (not just the renderer): the
		// renderer imports @tryghost/kg-default-nodes, whose ESM build has the same
		// extensionless lodash imports, and under vitest transitive deps are
		// externalized unless they match noExternal themselves.
		noExternal: [/^@tryghost\//],
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
		// SvelteKit overwrites build.cssMinify from build.minify; Vite 8 SSR defaults to
		// lightningcss, which fails on nested @keyframes in svelte-lexical's ActionBar.css.
		{
			name: 'css-minify-esbuild',
			configResolved(config) {
				config.build.cssMinify = 'esbuild';
			}
		},
		// @better-svelte-email/server uses postcss at runtime to inline email CSS.
		// postcss (CJS) does `require('nanoid/non-secure')`, but nanoid v5+ is pure ESM
		// and its /non-secure has no default export. Left external, adapter-node's
		// commonjs pass rewrites that require into `import x from 'nanoid/non-secure'`,
		// which Node rejects at load time ("does not provide an export named 'default'"),
		// crash-looping the server. Inlining postcss makes Vite resolve the interop at
		// build time instead. Only during `build`: forcing it in dev breaks Vite's SSR
		// module runner with "require is not defined" inside postcss. See
		// https://github.com/Konixy/better-svelte-email/issues/85 (and #33).
		{
			name: 'postcss-noexternal-on-build',
			config(_config, { command }) {
				if (command === 'build') {
					return { ssr: { noExternal: ['postcss'] } };
				}
			}
		},
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
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					// vitest doesn't run Vite's ssr.optimizeDeps prebundling, so the
					// @tryghost renderer chain (see the ssr config above) needs the same
					// treatment via vitest's esbuild-based deps optimizer.
					deps: {
						optimizer: {
							ssr: {
								enabled: true,
								include: [
									'@tryghost/kg-lexical-html-renderer',
									'@tryghost/kg-default-nodes',
									'@tryghost/kg-default-transforms',
									'@tryghost/kg-markdown-html-renderer',
									'@tryghost/kg-clean-basic-html',
									'@tryghost/kg-utils'
								],
								exclude: ['jsdom']
							}
						}
					}
				}
			}
		]
	}
});
