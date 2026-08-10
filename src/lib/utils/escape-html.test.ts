import { describe, it, expect } from 'vitest';
import { escapeHtml } from './escape-html';

describe('escapeHtml', () => {
	it('neutralises injected markup', () => {
		expect(escapeHtml('<img src=x onerror=alert(1)>')).toBe('&lt;img src=x onerror=alert(1)&gt;');
		expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
		expect(escapeHtml(`<a href="javascript:alert(1)">x</a>`)).toBe(
			'&lt;a href=&quot;javascript:alert(1)&quot;&gt;x&lt;/a&gt;'
		);
	});

	it('escapes ampersands once, not twice', () => {
		expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
		expect(escapeHtml('&lt;')).toBe('&amp;lt;');
	});

	it('keeps text people actually type in notes', () => {
		expect(escapeHtml('cost < 500 and x > 3')).toBe('cost &lt; 500 and x &gt; 3');
		expect(escapeHtml('<3 great work')).toBe('&lt;3 great work');
		expect(escapeHtml("she's here")).toBe('she&#39;s here');
	});

	it('preserves newlines for whitespace-pre-wrap', () => {
		expect(escapeHtml('line one\nline two')).toBe('line one\nline two');
	});

	it('handles empty input', () => {
		expect(escapeHtml('')).toBe('');
		expect(escapeHtml(null)).toBe('');
		expect(escapeHtml(undefined)).toBe('');
	});
});
