// @ts-check
import { adapter as svelte } from '@wuchale/svelte';
import { adapter as js } from 'wuchale/adapter-vanilla';
import { defineConfig } from 'wuchale';

export default defineConfig({
	// sourceLocale is en by default
	otherLocales: ['es', 'pt'],
	adapters: {
		main: svelte({
			loader: 'sveltekit',
			heuristic: (msg) => {
				const { details } = msg;
				if (details.call === 't') {
					return true as unknown as 'message'; // the type signature expects 'message' but a boolean is what seems to actually work
				} else {
					return false;
				}
			}
		}),
		js: js({
			loader: 'vite',
			files: [
				'src/**/+{page,layout}.{js,ts}',
				'src/**/+{page,layout}.server.{js,ts}',
				'src/**/items.ts'
			],
			heuristic: (msg) => {
				const { details } = msg;
				if (details.call === 't') {
					return true as unknown as 'message'; // the type signature expects 'message' but a boolean is what seems to actually work
				} else {
					return false;
				}
			}
		})
	}
});
