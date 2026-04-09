import { describe, it, expect } from 'vitest';
import { structuredClone } from './structuredClone';

describe('structuredClone', () => {
	it('should clone simple objects', () => {
		const obj = { a: 1, b: 2, c: { d: 3 } };
		const cloned = structuredClone(obj);

		expect(cloned).toEqual(obj);
		expect(cloned).not.toBe(obj);
		expect(cloned.c).not.toBe(obj.c);
	});

	it('should clone arrays', () => {
		const arr = [1, 2, 3, { a: 4 }];
		const cloned = structuredClone(arr);

		expect(cloned).toEqual(arr);
		expect(cloned).not.toBe(arr);
		expect(cloned[3]).not.toBe(arr[3]);
	});

	it('should clone nested structures', () => {
		const complex = {
			name: 'test',
			data: {
				items: [1, 2, 3],
				meta: { id: 123 }
			}
		};
		const cloned = structuredClone(complex);

		expect(cloned).toEqual(complex);
		expect(cloned).not.toBe(complex);
		expect(cloned.data).not.toBe(complex.data);
		expect(cloned.data.items).not.toBe(complex.data.items);
	});

	it('should handle null and undefined values in objects', () => {
		const obj = { a: null, b: 'test' };
		const cloned = structuredClone(obj);

		expect(cloned).toEqual(obj);
		expect(cloned.a).toBeNull();
		expect(structuredClone(undefined)).toBeUndefined();
	});

	it('should clone primitive values', () => {
		expect(structuredClone('string')).toBe('string');
		expect(structuredClone(42)).toBe(42);
		expect(structuredClone(true)).toBe(true);
		expect(structuredClone(null)).toBe(null);
	});
});
