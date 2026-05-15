import { describe, expect, it } from 'vitest';
import { renderEmailMessage } from './render_email_message';

function createBody(text: string) {
	return {
		root: {
			children: [
				{
					children: [
						{
							detail: 0,
							format: 0,
							mode: 'normal',
							style: '',
							text,
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
}

describe('renderEmailMessage', () => {
	it('renders Lexical JSON to HTML before resolving variables', async () => {
		const rendered = await renderEmailMessage({
			subject: 'Hello {{person.given_name}}',
			body: createBody('Hi {{person.given_name}} from {{organization.name}}'),
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

	it('escapes variable values inserted into HTML body', async () => {
		const rendered = await renderEmailMessage({
			subject: 'Hello {{person.given_name}}',
			body: createBody('Hi {{person.given_name}}'),
			personObject: {
				givenName: '<Ada & Co>',
				familyName: null,
				emailAddress: null,
				phoneNumber: null
			},
			organization: {
				name: 'Belcoda',
				slug: 'belcoda'
			}
		});

		expect(rendered.subject).toBe('Hello <Ada & Co>');
		expect(rendered.body).toContain('Hi &lt;Ada &amp; Co&gt;');
	});
});
