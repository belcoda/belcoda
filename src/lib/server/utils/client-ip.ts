import { isIP } from 'node:net';

function parseIp(value: string | null | undefined): string | undefined {
	if (!value) return undefined;
	const trimmed = value.trim();
	return isIP(trimmed) ? trimmed : undefined;
}

function parseXForwardedFor(value: string | null | undefined): string | undefined {
	if (!value) return undefined;
	for (const part of value.split(',')) {
		const ip = parseIp(part);
		if (ip) return ip;
	}
	return undefined;
}

export function getClientIpFromRequest(
	request: Request,
	fallback: () => string = () => 'unknown'
): string {
	return (
		parseIp(request.headers.get('cf-connecting-ip')) ??
		parseIp(request.headers.get('fly-client-ip')) ??
		parseXForwardedFor(request.headers.get('x-forwarded-for')) ??
		fallback()
	);
}
