/**
 * Host origins allowed for Zero sync connect-src (HTTP + WebSocket).
 */
export function getZeroSyncConnectSources(zeroServer: string | undefined): string[] {
	if (!zeroServer) return [];

	const sources: string[] = [];
	try {
		const url = new URL(zeroServer);
		sources.push(url.origin);
		if (url.protocol === 'https:') {
			sources.push(`wss://${url.host}`);
		} else if (url.protocol === 'http:') {
			sources.push(`ws://${url.host}`);
		}
	} catch {
		sources.push(zeroServer);
	}
	return sources;
}

/**
 * Public page routes customers embed via `?layout=embed` iframes on external sites.
 */
export function isPublicEmbedPage(pathname: string, searchParams: URLSearchParams): boolean {
	return pathname.startsWith('/page/') && searchParams.get('layout') === 'embed';
}

export function augmentContentSecurityPolicy(
	csp: string,
	options: {
		extraConnectSources?: string[];
		allowEmbedding?: boolean;
	}
): string {
	let result = csp;

	if (options.extraConnectSources?.length) {
		result = result.replace(
			/connect-src ([^;]+)/,
			(_, sources) => `connect-src ${sources} ${options.extraConnectSources!.join(' ')}`
		);
	}

	if (options.allowEmbedding) {
		result = result.replace(/frame-ancestors [^;]+/, 'frame-ancestors *');
	}

	return result;
}
