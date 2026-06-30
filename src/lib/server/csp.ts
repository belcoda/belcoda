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

export function augmentContentSecurityPolicy(
	csp: string,
	options: {
		extraConnectSources?: string[];
	}
): string {
	if (!options.extraConnectSources?.length) return csp;

	return csp.replace(
		/connect-src ([^;]+)/,
		(_, sources) => `connect-src ${sources} ${options.extraConnectSources!.join(' ')}`
	);
}
