import { describe, expect, it } from 'vitest';
import {
	REDACTED_EMAIL_VALUE,
	REDACTED_LOG_VALUE,
	redactLogArguments,
	redactSensitiveLogText
} from './log-redaction';

describe('log redaction', () => {
	it('redacts sensitive fields at any nesting depth', () => {
		const [result] = redactLogArguments([
			{
				token: 'reset-token',
				authToken: 'preview-token',
				cookies: 'session=secret',
				headers: { authorization: 'Bearer secret', cookie: 'session=secret' },
				payload: {
					invitationEmail: 'invitee@example.com',
					clientSecret: 'client-secret',
					requestId: 'safe-id'
				}
			}
		]);

		expect(result).toEqual({
			token: REDACTED_LOG_VALUE,
			authToken: REDACTED_LOG_VALUE,
			cookies: REDACTED_LOG_VALUE,
			headers: { authorization: REDACTED_LOG_VALUE, cookie: REDACTED_LOG_VALUE },
			payload: {
				invitationEmail: REDACTED_LOG_VALUE,
				clientSecret: REDACTED_LOG_VALUE,
				requestId: 'safe-id'
			}
		});
	});

	it('redacts sensitive URL parameters and email addresses in strings', () => {
		const result = redactSensitiveLogText(
			'Send https://example.com/reset?token=abc123&locale=en to person@example.com'
		);

		expect(result).toBe(
			`Send https://example.com/reset?token=${REDACTED_LOG_VALUE}&locale=en to ${REDACTED_EMAIL_VALUE}`
		);
	});

	it('redacts non-URL credential key/value formats in strings', () => {
		const result = redactSensitiveLogText(
			[
				'token=plain-secret',
				'Authorization: Bearer bearer-secret',
				'Cookie: session=cookie-secret; theme=light',
				'contact person@example.com'
			].join('\n')
		);

		expect(result).toBe(
			[
				`token=${REDACTED_LOG_VALUE}`,
				`Authorization: ${REDACTED_LOG_VALUE}`,
				`Cookie: ${REDACTED_LOG_VALUE}`,
				`contact ${REDACTED_EMAIL_VALUE}`
			].join('\n')
		);
	});

	it('redacts sensitive values from errors', () => {
		const error = new Error('Reset failed for person@example.com?token=abc123');
		const [result] = redactLogArguments([{ error }]) as [{ error: Error }];

		expect(result.error.message).not.toContain('person@example.com');
		expect(result.error.message).not.toContain('abc123');
		expect(result.error.stack).not.toContain('person@example.com');
	});
});
