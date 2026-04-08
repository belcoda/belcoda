/**
 * Safe storage utilities that handle SecurityErrors gracefully.
 * 
 * In certain contexts (iframes with cross-origin restrictions, private browsing modes,
 * or certain browser security settings), accessing localStorage/sessionStorage will
 * throw a SecurityError. These utilities provide a fallback to in-memory storage.
 */

type StorageType = 'localStorage' | 'sessionStorage';

class SafeStorage {
	private fallbackStorage = new Map<string, string>();
	private storageType: StorageType;
	private isAvailable: boolean;

	constructor(storageType: StorageType) {
		this.storageType = storageType;
		this.isAvailable = this.checkAvailability();
	}

	private checkAvailability(): boolean {
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
		return this.fallbackStorage.get(key) ?? null;
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
		this.fallbackStorage.set(key, value);
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
		this.fallbackStorage.delete(key);
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
		this.fallbackStorage.clear();
	}
}

export const safeLocalStorage = new SafeStorage('localStorage');
export const safeSessionStorage = new SafeStorage('sessionStorage');
