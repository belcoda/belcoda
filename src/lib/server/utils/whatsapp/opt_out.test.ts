import { describe, expect, it } from 'vitest';
import { isWhatsappOptOutMessage } from './opt_out';

describe('WhatsApp opt-out keyword detection', () => {
	it.each([
		'STOP',
		'stop',
		' Stop ',
		'STOP!',
		'stop...',
		'UNSUBSCRIBE',
		'unsubscribe',
		' Unsubscribe! '
	])('recognizes %j as an opt-out message', (message) => {
		expect(isWhatsappOptOutMessage(message)).toBe(true);
	});

	it.each(['', 'STOPPING', 'Please stop messaging me', 'STOP NOW', 'UNSUBSCRIBED'])(
		'does not recognize %j as an opt-out message',
		(message) => {
			expect(isWhatsappOptOutMessage(message)).toBe(false);
		}
	);
});
