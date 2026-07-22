import { describe, expect, it } from 'vitest';
import { getClientIpFromRequest } from './client-ip';

describe('getClientIpFromRequest', () => {
	it('prefers cf-connecting-ip over other headers', () => {
		const request = new Request('https://example.com', {
			headers: {
				'cf-connecting-ip': '203.0.113.1',
				'fly-client-ip': '198.51.100.2',
				'x-forwarded-for': '192.0.2.3, 198.51.100.4'
			}
		});

		expect(getClientIpFromRequest(request)).toBe('203.0.113.1');
	});

	it('uses fly-client-ip when cloudflare header is absent', () => {
		const request = new Request('https://example.com', {
			headers: {
				'fly-client-ip': '198.51.100.2',
				'x-forwarded-for': '192.0.2.3, 198.51.100.4'
			}
		});

		expect(getClientIpFromRequest(request)).toBe('198.51.100.2');
	});

	it('uses the first valid x-forwarded-for address as a fallback', () => {
		const request = new Request('https://example.com', {
			headers: {
				'x-forwarded-for': '192.0.2.3, 198.51.100.4'
			}
		});

		expect(getClientIpFromRequest(request)).toBe('192.0.2.3');
	});

	it('falls back to getClientAddress when no trusted headers are present', () => {
		const request = new Request('https://example.com');

		expect(getClientIpFromRequest(request, () => '127.0.0.1')).toBe('127.0.0.1');
	});
});
