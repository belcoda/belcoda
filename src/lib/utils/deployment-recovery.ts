export const DEPLOYMENT_RELOAD_STORAGE_KEY = 'belcoda:deploy-reload';

const CHUNK_LOAD_ERROR =
	/Importing a module script failed|Failed to fetch dynamically imported module|Loading chunk \d+ failed/i;

export function isChunkLoadError(message: string): boolean {
	return CHUNK_LOAD_ERROR.test(message);
}

export function clearDeploymentReloadFlag(): void {
	try {
		sessionStorage.removeItem(DEPLOYMENT_RELOAD_STORAGE_KEY);
	} catch {
		// sessionStorage may be unavailable (private browsing, restricted contexts)
	}
}

let reloadAttempted = false;

export function reloadForStaleDeployment(): boolean {
	if (reloadAttempted) {
		return false;
	}
	try {
		if (sessionStorage.getItem(DEPLOYMENT_RELOAD_STORAGE_KEY)) {
			return false;
		}
		sessionStorage.setItem(DEPLOYMENT_RELOAD_STORAGE_KEY, '1');
	} catch {
		// If sessionStorage fails, still attempt a single reload
	}

	reloadAttempted = true;
	const url = new URL(globalThis.location.href);
	url.searchParams.set('_r', String(Date.now()));
	globalThis.location.replace(url.toString());
	return true;
}

function handleChunkLoadFailure(message: string): void {
	if (isChunkLoadError(message)) {
		reloadForStaleDeployment();
	}
}

function messageFromRejectionReason(reason: unknown): string {
	if (reason instanceof Error) {
		return reason.message;
	}
	if (typeof reason === 'string') {
		return reason;
	}
	return String(reason ?? '');
}

export function registerDeploymentRecoveryListeners(): void {
	globalThis.addEventListener('error', (event) => {
		handleChunkLoadFailure(event.message ?? '');
	});

	globalThis.addEventListener('unhandledrejection', (event) => {
		handleChunkLoadFailure(messageFromRejectionReason(event.reason));
	});

	globalThis.addEventListener('vite:preloadError', (event) => {
		event.preventDefault();
		reloadForStaleDeployment();
	});
}
