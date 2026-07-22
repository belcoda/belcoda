import { describe, expect, it } from 'vitest';
import { htmlToPlaintext, stripHtmlAndTrim, stripHtmlTags } from './html';

describe('HTML plaintext utilities', () => {
	it('uses text-only sanitization while preserving expected line breaks', () => {
		expect(stripHtmlTags('<p>Hello <strong>world</strong></p><br>Again')).toBe(
			'Hello world\nAgain'
		);
	});

	it('removes scripts and dangerous elements from WhatsApp template text', () => {
		const result = stripHtmlTags(
			'<p>Hello</p><script>alert(1)</script><img src=x onerror="alert(2)">Safe'
		);

		expect(result).toContain('Hello');
		expect(result).toContain('Safe');
		expect(result).not.toContain('alert');
		expect(result).not.toContain('<script');
		expect(result).not.toContain('<img');
	});

	it('does not turn encoded or malformed tags into executable markup', () => {
		const encoded = stripHtmlTags('&lt;img src=x onerror=alert(1)&gt;');
		const malformed = stripHtmlTags('Before <img src=x onerror=alert(1) After');

		expect(encoded).not.toContain('<img');
		expect(malformed).not.toContain('<img');
	});

	it('retains existing trimming and plaintext formatting behavior', () => {
		expect(stripHtmlAndTrim('<p>Hello</p><p>world</p>')).toBe('Hello world');
		expect(htmlToPlaintext('<p><strong>Hello</strong><br><em>world</em></p>')).toBe(
			'**Hello**\n_world_'
		);
	});
});
