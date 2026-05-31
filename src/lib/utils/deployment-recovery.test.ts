import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	DEPLOYMENT_RELOAD_STORAGE_KEY,
	clearDeploymentReloadFlag,
	isChunkLoadError,
	reloadForStaleDeployment
} from './deployment-recovery';

describe('isChunkLoadError', () => {
	it('matches Safari module import failures', () => {
		expect(isChunkLoadError('Importing a module script failed')).toBe(true);
	});

	it('matches Chrome dynamic import failures', () => {
		expect(isChunkLoadError('Failed to fetch dynamically imported module')).toBe(true);
	});

	it('matches legacy webpack chunk failures', () => {
		expect(isChunkLoadError('Loading chunk 42 failed')).toBe(true);
	});

	it('rejects unrelated errors', () => {
		expect(isChunkLoadError('Network request failed')).toBe(false);
		expect(isChunkLoadError('Something went wrong')).toBe(false);
	});
});

describe('reloadForStaleDeployment', () => {
	const replace = vi.fn();
	let storage: Record<string, string>;

	beforeEach(() => {
		storage = {};
		replace.mockClear();
		vi.stubGlobal('sessionStorage', {
			getItem: (key: string) => storage[key] ?? null,
			setItem: (key: string, value: string) => {
				storage[key] = value;
			},
			removeItem: (key: string) => {
				delete storage[key];
			},
			clear: () => {
				storage = {};
			}
		});
		vi.stubGlobal('location', {
			href: 'https://app.belcoda.com/events',
			replace
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('reloads with a cache-bust param on first attempt', () => {
		vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);

		expect(reloadForStaleDeployment()).toBe(true);
		expect(storage[DEPLOYMENT_RELOAD_STORAGE_KEY]).toBe('1');
		expect(replace).toHaveBeenCalledWith(
			'https://app.belcoda.com/events?_r=1700000000000'
		);
	});

	it('does not reload again when the guard flag is set', () => {
		storage[DEPLOYMENT_RELOAD_STORAGE_KEY] = '1';

		expect(reloadForStaleDeployment()).toBe(false);
		expect(replace).not.toHaveBeenCalled();
	});
});

describe('clearDeploymentReloadFlag', () => {
	it('removes the reload guard from sessionStorage', () => {
		const storage: Record<string, string> = {
			[DEPLOYMENT_RELOAD_STORAGE_KEY]: '1'
		};
		vi.stubGlobal('sessionStorage', {
			getItem: (key: string) => storage[key] ?? null,
			setItem: (key: string, value: string) => {
				storage[key] = value;
			},
			removeItem: (key: string) => {
				delete storage[key];
			},
			clear: () => {
				for (const key of Object.keys(storage)) {
					delete storage[key];
				}
			}
		});

		clearDeploymentReloadFlag();

		expect(storage[DEPLOYMENT_RELOAD_STORAGE_KEY]).toBeUndefined();
		vi.unstubAllGlobals();
	});
});
