import { beforeEach, describe, expect, it, vi } from 'vitest';

const envState = vi.hoisted(() => ({
	POSTMARK_SERVER_TOKEN: 'test-token' as string | undefined
}));

const logger = vi.hoisted(() => ({
	debug: vi.fn(),
	error: vi.fn()
}));

vi.mock('$env/dynamic/private', () => ({
	env: envState
}));

vi.mock('$lib/pino', () => ({
	default: () => logger
}));

vi.mock('@better-svelte-email/server', () => ({
	toPlainText: (html: string) => html
}));

import sendHtmlEmail from './send_html_email';

const options = {
	to: 'recipient@example.com',
	from: 'sender@example.com',
	html: '<p>Hello</p>',
	subject: 'Invite',
	stream: 'outbound' as const
};

describe('sendHtmlEmail', () => {
	beforeEach(() => {
		envState.POSTMARK_SERVER_TOKEN = 'test-token';
		logger.debug.mockReset();
		logger.error.mockReset();
		vi.unstubAllGlobals();
	});

	it('fails fast when POSTMARK_SERVER_TOKEN is missing', async () => {
		envState.POSTMARK_SERVER_TOKEN = undefined;
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);

		await expect(sendHtmlEmail(options)).rejects.toThrow('POSTMARK_SERVER_TOKEN is not configured');
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('logs only the subject and provider message ID on success', async () => {
		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockResolvedValue(
					new Response(JSON.stringify({ MessageID: 'provider-message-id' }), { status: 200 })
				)
		);

		await expect(sendHtmlEmail(options)).resolves.toBe('provider-message-id');
		expect(logger.debug).toHaveBeenNthCalledWith(
			1,
			{ subject: 'Invite' },
			'Sending HTML email with Postmark'
		);
		expect(logger.debug).toHaveBeenNthCalledWith(
			2,
			{ subject: 'Invite', providerMessageId: 'provider-message-id' },
			'Email sent successfully'
		);
		expect(JSON.stringify(logger.debug.mock.calls)).not.toContain('recipient@example.com');
	});

	it('sends the Postmark request with a timeout signal', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(
				new Response(JSON.stringify({ MessageID: 'provider-message-id' }), { status: 200 })
			);
		vi.stubGlobal('fetch', fetchMock);

		await sendHtmlEmail(options);

		expect(fetchMock).toHaveBeenCalledWith(
			'https://api.postmarkapp.com/email',
			expect.objectContaining({
				method: 'POST',
				signal: expect.any(AbortSignal)
			})
		);
	});

	it('logs Postmark status without the provider response body', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(
				new Response('Invalid "To" address: recipient@example.com', { status: 422 })
			)
		);

		await expect(sendHtmlEmail(options)).rejects.toThrow('Failed to send email');
		expect(logger.error).toHaveBeenCalledWith(
			{ subject: 'Invite', status: 422 },
			'Failed to send email'
		);
		expect(JSON.stringify(logger.error.mock.calls)).not.toContain('recipient@example.com');
	});
	});

	it.each([
		['empty', ''],
		['malformed', '{not-json']
	])('uses the generic failure path for %s successful responses', async (_label, body) => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body, { status: 200 })));

		await expect(sendHtmlEmail(options)).rejects.toThrow('Failed to send email');
		expect(logger.error).toHaveBeenCalledWith({ subject: 'Invite' }, 'Failed to send email');
		expect(JSON.stringify(logger.error.mock.calls)).not.toContain('recipient@example.com');
	});
});
