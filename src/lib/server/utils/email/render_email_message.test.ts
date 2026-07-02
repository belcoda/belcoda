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

function createTextNode(text: string) {
	return {
		detail: 0,
		format: 0,
		mode: 'normal',
		style: '',
		text,
		type: 'text',
		version: 1
	};
}

function createParagraphNode(children: unknown[]) {
	return {
		children,
		direction: 'ltr',
		format: '',
		indent: 0,
		type: 'paragraph',
		version: 1
	};
}

// Mirrors the JSON produced by the svelte-lexical ImageNode's exportJSON()
function createImageNode({
	src = 'https://example.com/image.png',
	altText = 'An example image'
}: { src?: string; altText?: string } = {}) {
	return {
		altText,
		caption: {
			editorState: {
				root: {
					children: [],
					direction: null,
					format: '',
					indent: 0,
					type: 'root',
					version: 1
				}
			}
		},
		height: 0,
		maxWidth: 500,
		showCaption: false,
		src,
		type: 'image',
		version: 1,
		width: 0
	};
}

function createBodyWithNodes(children: unknown[]) {
	return {
		root: {
			children,
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

	it('renders svelte-lexical image nodes as img tags', async () => {
		// svelte-lexical wraps inserted images in a paragraph node
		const body = createBodyWithNodes([
			createParagraphNode([createTextNode('Look at this:')]),
			createParagraphNode([
				createImageNode({
					src: 'https://example.com/photo.jpg',
					altText: 'A photo of a meeting'
				})
			]),
			createParagraphNode([createTextNode('Nice, right?')])
		]);

		const rendered = await renderEmailMessage({
			subject: 'Photos',
			body,
			organization: { name: 'Belcoda', slug: 'belcoda' }
		});

		expect(rendered.body).toContain('<img');
		expect(rendered.body).toContain('src="https://example.com/photo.jpg"');
		expect(rendered.body).toContain('alt="A photo of a meeting"');
		expect(rendered.body).toContain('<p>Look at this:</p>');
		expect(rendered.body).toContain('<p>Nice, right?</p>');
		// the image markup should appear between the two paragraphs
		expect(rendered.body.indexOf('<img')).toBeGreaterThan(
			rendered.body.indexOf('<p>Look at this:</p>')
		);
		expect(rendered.body.indexOf('<img')).toBeLessThan(
			rendered.body.indexOf('<p>Nice, right?</p>')
		);
	});

	it('does not render image nodes without a usable src', async () => {
		const body = createBodyWithNodes([
			createParagraphNode([createTextNode('Before')]),
			createParagraphNode([createImageNode({ src: '' })]),
			createParagraphNode([createTextNode('After')])
		]);

		const rendered = await renderEmailMessage({
			subject: 'No image',
			body,
			organization: { name: 'Belcoda', slug: 'belcoda' }
		});

		expect(rendered.body).not.toContain('<img');
		expect(rendered.body).toContain('<p>Before</p>');
		expect(rendered.body).toContain('<p>After</p>');
	});

	it('renders bodies without images identically to the plain renderer output', async () => {
		const body = createBodyWithNodes([
			createParagraphNode([createTextNode('Hello world')]),
			createParagraphNode([createTextNode('Second paragraph')])
		]);

		const rendered = await renderEmailMessage({
			subject: 'Plain',
			body,
			organization: { name: 'Belcoda', slug: 'belcoda' }
		});

		expect(rendered.body).toBe('<p>Hello world</p><p>Second paragraph</p>');
	});

	it('does not mutate the body object passed in', async () => {
		const body = createBodyWithNodes([
			createParagraphNode([createTextNode('Text'), createImageNode()])
		]);
		const snapshot = structuredClone(body);

		await renderEmailMessage({
			subject: 'Immutable',
			body,
			organization: { name: 'Belcoda', slug: 'belcoda' }
		});

		expect(body).toEqual(snapshot);
	});

	it('renders an image interleaved between text within the same paragraph in order', async () => {
		// svelte-lexical can insert an image inline within an existing paragraph,
		// alongside other text nodes, rather than always wrapping it alone.
		const body = createBodyWithNodes([
			createParagraphNode([
				createTextNode('Before'),
				createImageNode({ src: 'https://example.com/inline.jpg' }),
				createTextNode('After')
			])
		]);

		const rendered = await renderEmailMessage({
			subject: 'Inline image',
			body,
			organization: { name: 'Belcoda', slug: 'belcoda' }
		});

		expect(rendered.body).toBe(
			'<p>Before</p><figure class="kg-card kg-image-card"><img src="https://example.com/inline.jpg" class="kg-image" alt="An example image" loading="lazy"></figure><p>After</p>'
		);
	});

	it('renders an image nested in a list item without leaving an empty list item behind', async () => {
		const body = createBodyWithNodes([
			{
				children: [
					{
						children: [createImageNode({ src: 'https://example.com/list-image.jpg' })],
						direction: 'ltr',
						format: '',
						indent: 0,
						type: 'listitem',
						value: 1,
						version: 1
					}
				],
				direction: 'ltr',
				format: '',
				indent: 0,
				type: 'list',
				listType: 'bullet',
				start: 1,
				tag: 'ul',
				version: 1
			}
		]);

		const rendered = await renderEmailMessage({
			subject: 'List image',
			body,
			organization: { name: 'Belcoda', slug: 'belcoda' }
		});

		expect(rendered.body).toContain('<img');
		expect(rendered.body).toContain('src="https://example.com/list-image.jpg"');
		expect(rendered.body).not.toContain('<li');
		expect(rendered.body).not.toContain('<ul');
	});

	it('hoists images nested inside siblings of a split paragraph to the top level', async () => {
		// A paragraph with a direct image AND a nested container holding another
		// image: the nested image's card must land at the root level, not inside
		// a paragraph copy, or the renderer silently truncates the segment.
		const body = createBodyWithNodes([
			createParagraphNode([
				createTextNode('Start'),
				createImageNode({ src: 'https://example.com/direct.jpg' }),
				{
					children: [createImageNode({ src: 'https://example.com/nested.jpg' })],
					direction: 'ltr',
					format: '',
					indent: 0,
					rel: null,
					target: null,
					title: null,
					type: 'link',
					url: 'https://example.com',
					version: 1
				},
				createTextNode('End')
			])
		]);

		const rendered = await renderEmailMessage({
			subject: 'Nested sibling image',
			body,
			organization: { name: 'Belcoda', slug: 'belcoda' }
		});

		expect(rendered.body).toContain('src="https://example.com/direct.jpg"');
		expect(rendered.body).toContain('src="https://example.com/nested.jpg"');
		expect(rendered.body).toContain('<p>Start</p>');
		expect(rendered.body).toContain('<p>End</p>');
		// image cards must never end up inside a <p>
		expect(rendered.body).not.toMatch(/<p>[^<]*<figure/);
	});

	it('substitutes template variables in mixed text and image bodies', async () => {
		const body = createBodyWithNodes([
			createParagraphNode([createTextNode('Hi {{person.given_name}},')]),
			createParagraphNode([createImageNode({ src: 'https://example.com/banner.png' })]),
			createParagraphNode([createTextNode('From {{organization.name}}')])
		]);

		const rendered = await renderEmailMessage({
			subject: 'Hello {{person.given_name}}',
			body,
			personObject: {
				givenName: 'Ada',
				familyName: 'Lovelace',
				emailAddress: 'ada@example.com',
				phoneNumber: '+441234567890'
			},
			organization: { name: 'Belcoda', slug: 'belcoda' }
		});

		expect(rendered.subject).toBe('Hello Ada');
		expect(rendered.body).toContain('Hi Ada,');
		expect(rendered.body).toContain('From Belcoda');
		expect(rendered.body).toContain('src="https://example.com/banner.png"');
	});
});
