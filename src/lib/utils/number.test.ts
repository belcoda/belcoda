import { describe, it, expect } from 'vitest';
import { formatNumber } from './number';

describe('formatNumber', () => {
	it('uses locale decimal separators', () => {
		expect(formatNumber(1234.5, 'en')).toBe('1,234.5');
		expect(formatNumber(1234.5, 'es')).toBe('1234,5');
		expect(formatNumber(1234.5, 'pt')).toBe('1.234,5');
	});

	it('honours fraction-digit options for coordinates', () => {
		const options = { minimumFractionDigits: 5, maximumFractionDigits: 5 };
		expect(formatNumber(40.123, 'en', options)).toBe('40.12300');
		expect(formatNumber(40.123, 'es', options)).toBe('40,12300');
		expect(formatNumber(0, 'de', options)).toBe('0,00000');
	});
});
