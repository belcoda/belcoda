import { detectSubdomain } from '$lib/utils/routing';

/**
 * Host origins allowed for Zero sync connect-src (HTTP + WebSocket).
 */
export function getZeroSyncConnectSources(zeroServer: string | undefined): string[] {
	const zeroServerUrl = zeroServer?.trim();
	if (!zeroServerUrl) return [];

	const sources: string[] = [];
	try {
		const url = new URL(zeroServerUrl);
		if (!['http:', 'https:', 'ws:', 'wss:'].includes(url.protocol)) {
			return [];
		}
		sources.push(url.origin);
		if (url.protocol === 'https:') {
			sources.push(`wss://${url.host}`);
		} else if (url.protocol === 'http:') {
			sources.push(`ws://${url.host}`);
		}
	} catch {
		return [];
	}
	return sources;
}

/**
 * Public page routes customers embed via `?layout=embed` iframes on external sites.
 */
const publicEmbedPathPattern = /^\/(events|petitions)\//;
const canonicalPublicEmbedPathPattern = /^\/page\/[^/]+\/(events|petitions)\//;

export function isPublicEmbedPage(
	pathname: string,
	searchParams: URLSearchParams,
	options?: { host?: string; rootDomain?: string }
): boolean {
	if (searchParams.get('layout') !== 'embed') return false;

	if (canonicalPublicEmbedPathPattern.test(pathname)) {
		return true;
	}

	const { host, rootDomain } = options ?? {};
	if (!host || !rootDomain) return false;

	return detectSubdomain(host, rootDomain) !== false && publicEmbedPathPattern.test(pathname);
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
