import type { LookupAddress } from 'node:dns';
import { lookup as dnsLookup } from 'node:dns/promises';
import { request as httpsRequest } from 'node:https';
import { BlockList, isIP, type LookupFunction } from 'node:net';
import { WEBHOOK_TARGET_URL_MAX_LENGTH } from '$lib/schema/webhook';

export const MAX_WEBHOOK_RESPONSE_BYTES = 16 * 1024;
const WEBHOOK_RESPONSE_TRUNCATION_MARKER = `\n[response truncated at ${MAX_WEBHOOK_RESPONSE_BYTES} bytes]`;

const blockedIpv4 = new BlockList();
for (const [network, prefix] of [
	['0.0.0.0', 8], // Current network / "this host"; not routable as a public endpoint.
	['10.0.0.0', 8], // RFC1918 private network.
	['100.64.0.0', 10], // Carrier-grade NAT shared address space.
	['127.0.0.0', 8], // Loopback addresses.
	['169.254.0.0', 16], // Link-local metadata/service discovery range.
	['172.16.0.0', 12], // RFC1918 private network.
	['192.0.0.0', 24], // IETF protocol assignments, not general public hosting.
	['192.0.2.0', 24], // TEST-NET-1 documentation range.
	['192.88.99.0', 24], // Deprecated IPv6-to-IPv4 relay anycast range.
	['192.168.0.0', 16], // RFC1918 private network.
	['198.18.0.0', 15], // Benchmark testing range.
	['198.51.100.0', 24], // TEST-NET-2 documentation range.
	['203.0.113.0', 24], // TEST-NET-3 documentation range.
	['224.0.0.0', 4], // Multicast range.
	['240.0.0.0', 4] // Reserved for future use / limited broadcast space.
] as const) {
	blockedIpv4.addSubnet(network, prefix, 'ipv4');
}

const blockedIpv6 = new BlockList();
for (const [network, prefix] of [
	['3fff::', 20],
	['2001::', 23],
	['2001:db8::', 32],
	['2002::', 16]
] as const) {
	blockedIpv6.addSubnet(network, prefix, 'ipv6');
}

export function isPublicWebhookAddress(address: string): boolean {
	const family = isIP(address);
	if (family === 4) {
		return !blockedIpv4.check(address, 'ipv4');
	}
	if (family === 6) {
		// Only currently allocated global-unicast space is accepted. This also rejects
		// loopback, unspecified, IPv4-mapped, unique-local, link-local and multicast addresses.
		const firstHextet = address.startsWith('::') ? 0 : Number.parseInt(address.split(':')[0]!, 16);
		return firstHextet >= 0x2000 && firstHextet <= 0x3fff && !blockedIpv6.check(address, 'ipv6');
	}
	return false;
}

export function parseWebhookTarget(targetUrl: string): URL {
	if (targetUrl.length > WEBHOOK_TARGET_URL_MAX_LENGTH) {
		throw new Error(`Webhook target must be at most ${WEBHOOK_TARGET_URL_MAX_LENGTH} characters`);
	}
	const url = new URL(targetUrl);
	if (url.protocol !== 'https:') {
		throw new Error('Webhook target must use HTTPS');
	}
	if (url.username || url.password) {
		throw new Error('Webhook target must not contain credentials');
	}
	return url;
}

export async function resolvePublicWebhookAddress(
	url: URL,
	lookup: typeof dnsLookup = dnsLookup
): Promise<LookupAddress> {
	const hostname = url.hostname.replace(/^\[|\]$/g, '');
	const literalFamily = isIP(hostname);
	const addresses = literalFamily
		? [{ address: hostname, family: literalFamily }]
		: await lookup(hostname, { all: true, verbatim: true });

	if (addresses.length === 0 || addresses.some(({ address }) => !isPublicWebhookAddress(address))) {
		throw new Error('Webhook target resolves to a non-public address');
	}
	return addresses[0]!;
}

function truncateUtf8TextToBytes(value: string, maxBytes: number): string {
	if (Buffer.byteLength(value) <= maxBytes) return value;

	let result = '';
	let byteLength = 0;
	for (const character of value) {
		const characterByteLength = Buffer.byteLength(character);
		if (byteLength + characterByteLength > maxBytes) break;
		result += character;
		byteLength += characterByteLength;
	}
	return result;
}

export function readBoundedWebhookResponse(response: NodeJS.ReadableStream): Promise<string> {
	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = [];
		const markerByteLength = Buffer.byteLength(WEBHOOK_RESPONSE_TRUNCATION_MARKER);
		const maxBodyByteLength = MAX_WEBHOOK_RESPONSE_BYTES - markerByteLength;
		let byteLength = 0;
		let settled = false;

		response.on('data', (value: Buffer | string) => {
			if (settled) return;
			const chunk = Buffer.isBuffer(value) ? value : Buffer.from(value);
			const remaining = maxBodyByteLength - byteLength;
			if (chunk.length <= remaining) {
				chunks.push(chunk);
				byteLength += chunk.length;
				return;
			}

			if (remaining > 0) chunks.push(chunk.subarray(0, remaining));
			settled = true;
			(response as NodeJS.ReadableStream & { destroy(): void }).destroy();
			const body = truncateUtf8TextToBytes(
				Buffer.concat(chunks).toString('utf8'),
				maxBodyByteLength
			);
			resolve(`${body}${WEBHOOK_RESPONSE_TRUNCATION_MARKER}`);
		});
		response.on('end', () => {
			if (settled) return;
			settled = true;
			resolve(Buffer.concat(chunks).toString('utf8'));
		});
		response.on('error', (error) => {
			if (settled) return;
			settled = true;
			reject(error);
		});
	});
}

function waitForWithAbort<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
	return new Promise((resolve, reject) => {
		if (signal.aborted) {
			reject(signal.reason);
			return;
		}

		const onAbort = () => reject(signal.reason);
		signal.addEventListener('abort', onAbort, { once: true });
		promise.then(
			(value) => {
				signal.removeEventListener('abort', onAbort);
				resolve(value);
			},
			(error) => {
				signal.removeEventListener('abort', onAbort);
				reject(error);
			}
		);
	});
}

export async function postWebhook({
	targetUrl,
	headers,
	body,
	signal
}: {
	targetUrl: string;
	headers: Record<string, string>;
	body: string;
	signal: AbortSignal;
}): Promise<{ status: number; statusText: string; ok: boolean; body: string }> {
	const url = parseWebhookTarget(targetUrl);
	const resolved = await waitForWithAbort(resolvePublicWebhookAddress(url), signal);
	const pinnedLookup: LookupFunction = (_hostname, _options, callback) => {
		callback(null, resolved.address, resolved.family);
	};

	return new Promise((resolve, reject) => {
		const request = httpsRequest(
			{
				protocol: url.protocol,
				hostname: url.hostname.replace(/^\[|\]$/g, ''),
				port: url.port || undefined,
				path: `${url.pathname}${url.search}`,
				method: 'POST',
				headers: { ...headers, 'Content-Length': Buffer.byteLength(body).toString() },
				signal,
				family: resolved.family,
				lookup: pinnedLookup
			},
			async (response) => {
				try {
					// Native https requests do not follow redirects, so a 3xx response cannot
					// bypass the validated and DNS-pinned destination.
					const responseBody = await readBoundedWebhookResponse(response);
					const status = response.statusCode ?? 0;
					resolve({
						status,
						statusText: response.statusMessage ?? '',
						ok: status >= 200 && status < 300,
						body: responseBody
					});
				} catch (error) {
					reject(error);
				}
			}
		);
		request.on('error', reject);
		request.end(body);
	});
}
