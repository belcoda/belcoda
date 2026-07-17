import { beforeEach, describe, expect, it, vi } from 'vitest';

const logger = vi.hoisted(() => ({
	debug: vi.fn(),
	error: vi.fn()
}));

vi.mock('$lib/pino', () => ({
	default: () => logger
}));

import sendTemplateEmail from './send_template_email';

const options = {
	to: 'recipient@example.com',
	from: 'sender@example.com',
	template: 'password-reset',
	stream: 'outbound' as const,
	context: {
		resetUrl: 'https://example.com/reset?token=unused-reset-token',
		email: 'recipient@example.com'
	}
};

describe('sendTemplateEmail logging', () => {
	beforeEach(() => {
		logger.debug.mockReset();
		logger.error.mockReset();
		vi.unstubAllGlobals();
	});

	it('logs only the template alias and provider message ID on success', async () => {
		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockResolvedValue(
					new Response(JSON.stringify({ MessageID: 'provider-message-id' }), { status: 200 })
				)
		);

		await expect(sendTemplateEmail(options)).resolves.toBe('provider-message-id');
		expect(logger.debug).toHaveBeenNthCalledWith(
			1,
			{ templateAlias: 'password-reset' },
			'Sending template email with Postmark'
		);
		expect(logger.debug).toHaveBeenNthCalledWith(
			2,
			{ templateAlias: 'password-reset', providerMessageId: 'provider-message-id' },
			'Email sent successfully'
		);
		expect(JSON.stringify(logger.debug.mock.calls)).not.toContain('unused-reset-token');
		expect(JSON.stringify(logger.debug.mock.calls)).not.toContain('recipient@example.com');
	});

	it('does not log provider error bodies', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(
				new Response(
					JSON.stringify({
						ErrorCode: 422,
						Message: 'Invalid recipient@example.com token=secret'
					}),
					{ status: 422 }
				)
			)
		);

		await expect(sendTemplateEmail(options)).rejects.toThrow('Failed to send email');
		expect(logger.error).toHaveBeenCalledWith(
			{ templateAlias: 'password-reset' },
			'Failed to send email'
		);
		expect(JSON.stringify(logger.error.mock.calls)).not.toContain('recipient@example.com');
		expect(JSON.stringify(logger.error.mock.calls)).not.toContain('secret');
	});
});
