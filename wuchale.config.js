// @ts-check
import { adapter as svelte } from '@wuchale/svelte';
import { adapter as js } from 'wuchale/adapter-vanilla';
import { defineConfig } from 'wuchale';
import { gemini } from 'wuchale';

export default defineConfig({
	// sourceLocale is en by default
	ai: gemini({
		model: 'gemini-3.1-flash-lite-preview',
		batchSize: 40,
		parallel: 5,
		think: true // default: false
	}),
	locales: ['en', 'es', 'pt'],
	adapters: {
		main: svelte({
			loader: 'sveltekit',
			heuristic: (msg) => {
				const { details } = msg;
				if (details.call === 't') {
					return 'message';
				} else {
					return false;
				}
			}
		}),
		js: js({
			loader: 'vite',
			files: {
				include: [
					'src/**/+{page,layout}.{js,ts}',
					'src/**/+{page,layout}.server.{js,ts}',
					'src/**/items.ts',
					'src/lib/**/*.ts'
				],
				ignore: ['src/**/*.svelte.ts']
			},
			heuristic: (msg) => {
				const { details } = msg;
				if (details.call === 't') {
					return 'message';
				} else {
					return false;
				}
			}
		})
	}
});
