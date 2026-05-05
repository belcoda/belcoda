import { describe, expect, it } from 'vitest';
import { renderEmailMessage } from './render_email_message';

const body = {
	root: {
		children: [
			{
				children: [
					{
						detail: 0,
						format: 0,
						mode: 'normal',
						style: '',
						text: 'Hi {{person.given_name}} from {{organization.name}}',
						type: 'text',
						version: 1
					}
				],
				direction: 'ltr',
				format: '',
				indent: 0,
				type: 'paragraph',
				version: 1
			}
		],
		direction: 'ltr',
		format: '',
		indent: 0,
		type: 'root',
		version: 1
	}
};

describe('renderEmailMessage', () => {
	it('resolves variables in the subject and Lexical body before rendering', async () => {
		const rendered = await renderEmailMessage({
			subject: 'Hello {{person.given_name}}',
			body,
			personObject: {
				givenName: 'Ada',
				familyName: 'Lovelace',
				emailAddress: 'ada@example.com',
				phoneNumber: '+441234567890'
			},
			organization: {
				name: 'Belcoda',
				slug: 'belcoda'
			},
			sender: {
				name: 'Grace Hopper',
				email: 'grace@example.com'
			}
		});

		expect(rendered.subject).toBe('Hello Ada');
		expect(rendered.body).toContain('Hi Ada from Belcoda');
	});
});
