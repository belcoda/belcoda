/**
 * Safe storage utilities that handle SecurityErrors gracefully.
 *
 * In certain contexts (iframes with cross-origin restrictions, private browsing modes,
 * or certain browser security settings), accessing localStorage/sessionStorage will
 * throw a SecurityError. These utilities provide a fallback to in-memory storage.
 *
 * IMPORTANT: Fallback storage only works in the browser. On the server (SSR), this
 * is a no-op to prevent state leakage between requests.
 */

import { browser } from '$app/environment';

type StorageType = 'localStorage' | 'sessionStorage';

class SafeStorage {
	private storageType: StorageType;
	private isAvailable: boolean;

	constructor(storageType: StorageType) {
		this.storageType = storageType;
		this.isAvailable = this.checkAvailability();
	}

	private checkAvailability(): boolean {
		if (!browser) {
			return false;
		}
		try {
			const storage = this.storageType === 'localStorage' ? localStorage : sessionStorage;
			const testKey = '__storage_test__';
			storage.setItem(testKey, 'test');
			storage.removeItem(testKey);
			return true;
		} catch {
			return false;
		}
	}

	private getFallbackStorage(): Map<string, string> {
		if (!browser) {
			return new Map();
		}

		const globalKey = `__safe_${this.storageType}_fallback__`;

		if (!(globalThis as any)[globalKey]) {
			(globalThis as any)[globalKey] = new Map<string, string>();
		}

		return (globalThis as any)[globalKey];
	}

	getItem(key: string): string | null {
		if (this.isAvailable) {
			try {
				const storage = this.storageType === 'localStorage' ? localStorage : sessionStorage;
				return storage.getItem(key);
			} catch (error) {
				console.warn(`Failed to access ${this.storageType}:`, error);
				this.isAvailable = false;
			}
		}

		if (!browser) {
			return null;
		}

		return this.getFallbackStorage().get(key) ?? null;
	}

	setItem(key: string, value: string): void {
		if (this.isAvailable) {
			try {
				const storage = this.storageType === 'localStorage' ? localStorage : sessionStorage;
				storage.setItem(key, value);
				return;
			} catch (error) {
				console.warn(`Failed to write to ${this.storageType}:`, error);
				this.isAvailable = false;
			}
		}

		if (!browser) {
			return;
		}

		this.getFallbackStorage().set(key, value);
	}

	removeItem(key: string): void {
		if (this.isAvailable) {
			try {
				const storage = this.storageType === 'localStorage' ? localStorage : sessionStorage;
				storage.removeItem(key);
				return;
			} catch (error) {
				console.warn(`Failed to remove from ${this.storageType}:`, error);
				this.isAvailable = false;
			}
		}

		if (!browser) {
			return;
		}

		this.getFallbackStorage().delete(key);
	}

	clear(): void {
		if (this.isAvailable) {
			try {
				const storage = this.storageType === 'localStorage' ? localStorage : sessionStorage;
				storage.clear();
				return;
			} catch (error) {
				console.warn(`Failed to clear ${this.storageType}:`, error);
				this.isAvailable = false;
			}
		}

		if (!browser) {
			return;
		}

		this.getFallbackStorage().clear();
	}
}

export const safeLocalStorage = new SafeStorage('localStorage');
export const safeSessionStorage = new SafeStorage('sessionStorage');
