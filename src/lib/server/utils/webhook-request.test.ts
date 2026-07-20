import { describe, expect, it, vi } from 'vitest';
import { Readable } from 'node:stream';
import { WEBHOOK_TARGET_URL_MAX_LENGTH } from '$lib/schema/webhook';
import {
	MAX_WEBHOOK_RESPONSE_BYTES,
	isPublicWebhookAddress,
	parseWebhookTarget,
	readBoundedWebhookResponse,
	resolvePublicWebhookAddress
} from './webhook-request';

describe('webhook request SSRF protection', () => {
	it.each([
		'0.0.0.0',
		'10.0.0.1',
		'100.64.0.1',
		'127.0.0.1',
		'169.254.169.254',
		'172.16.0.1',
		'192.88.99.2',
		'192.168.1.1',
		'224.0.0.1',
		'::',
		'::1',
		'::ffff:127.0.0.1',
		'fc00::1',
		'fe80::1',
		'ff02::1',
		'3fff::1',
		'2001:db8::1'
	])('rejects non-public address %s', (address) => {
		expect(isPublicWebhookAddress(address)).toBe(false);
	});

	it.each(['8.8.8.8', '1.1.1.1', '2606:4700:4700::1111'])(
		'accepts public address %s',
		(address) => {
			expect(isPublicWebhookAddress(address)).toBe(true);
		}
	);

	it('requires HTTPS and rejects embedded credentials', () => {
		expect(() => parseWebhookTarget('http://example.com/hook')).toThrow(/HTTPS/);
		expect(() => parseWebhookTarget('https://user:password@example.com/hook')).toThrow(
			/credentials/
		);
		expect(parseWebhookTarget('https://example.com/hook').hostname).toBe('example.com');
	});

	it('rejects over-limit webhook target URLs before URL parsing', () => {
		const oversizedTarget = 'x'.repeat(WEBHOOK_TARGET_URL_MAX_LENGTH + 1);

		expect(() => parseWebhookTarget(oversizedTarget)).toThrow(/at most 2048 characters/);
	});

	it('rejects a hostname if any DNS result is non-public', async () => {
		const lookup = vi.fn().mockResolvedValue([
			{ address: '8.8.8.8', family: 4 },
			{ address: '127.0.0.1', family: 4 }
		]);

		await expect(
			resolvePublicWebhookAddress(new URL('https://example.com'), lookup)
		).rejects.toThrow(/non-public/);
		expect(lookup).toHaveBeenCalledOnce();
	});

	it('truncates response bodies before they are logged', async () => {
		const response = Readable.from([
			Buffer.alloc(MAX_WEBHOOK_RESPONSE_BYTES, 'a'),
			Buffer.from('internal response that must not be stored')
		]);

		const body = await readBoundedWebhookResponse(response);

		expect(Buffer.byteLength(body)).toBeLessThan(MAX_WEBHOOK_RESPONSE_BYTES + 100);
		expect(body).toContain(`[response truncated at ${MAX_WEBHOOK_RESPONSE_BYTES} bytes]`);
		expect(body).not.toContain('internal response');
	});
});
