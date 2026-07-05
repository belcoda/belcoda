import { describe, it, expect } from 'vitest';
import { parse as valibotParse } from 'valibot';
import { createPerson } from '$lib/schema/person';
import { mapCsvRowToPerson, providedFields, type CsvRow } from './csv-map';

/**
 * Build the partial update payload the way parseImportCsv does: map + validate the
 * row, then keep only the fields the row actually supplied.
 */
function buildUpdatePatch(csvRow: CsvRow): Record<string, unknown> {
	const validated = valibotParse(createPerson, mapCsvRowToPerson(csvRow)) as Record<
		string,
		unknown
	>;
	const patch: Record<string, unknown> = {};
	for (const field of providedFields(csvRow)) {
		patch[field] = validated[field];
	}
	return patch;
}

describe('providedFields', () => {
	it('includes only columns present with a non-empty value', () => {
		const fields = providedFields({
			country: 'US',
			email: 'a@b.com',
			given_name: 'Ada'
		});
		expect(fields.sort()).toEqual(['country', 'emailAddress', 'givenName'].sort());
	});

	it('treats a blank cell as absent (leave-alone semantics)', () => {
		const fields = providedFields({
			country: 'US',
			email: 'a@b.com',
			given_name: '   '
		});
		expect(fields).not.toContain('givenName');
	});

	it('recognises a field via any of its column aliases', () => {
		expect(providedFields({ first_name: 'Ada' })).toContain('givenName');
		expect(providedFields({ givenName: 'Ada' })).toContain('givenName');
		expect(providedFields({ zip: '90210' })).toContain('postcode');
	});
});

describe('update patch construction', () => {
	it('omits fields the row did not supply so existing values are untouched', () => {
		// A row that only updates the phone number, keyed by email.
		const patch = buildUpdatePatch({
			country: 'US',
			email: 'a@b.com',
			phone: '+12025550123'
		});
		expect(Object.keys(patch).sort()).toEqual(['country', 'emailAddress', 'phoneNumber'].sort());
		expect(patch).not.toHaveProperty('givenName');
		expect(patch).not.toHaveProperty('subscribed');
		expect(patch).not.toHaveProperty('workplace');
	});

	it('allows external_id to be updated when supplied', () => {
		const patch = buildUpdatePatch({
			country: 'US',
			email: 'a@b.com',
			external_id: 'crm-123'
		});
		expect(patch.externalId).toBe('crm-123');
	});

	it('does not inject boolean defaults when the column is absent', () => {
		// subscribed/doNotContact default on insert, but must not appear in an update
		// patch that omits them, otherwise they would clobber existing values.
		const patch = buildUpdatePatch({ country: 'US', email: 'a@b.com' });
		expect(patch).not.toHaveProperty('subscribed');
		expect(patch).not.toHaveProperty('doNotContact');
	});
});

describe('mapCsvRowToPerson', () => {
	it('throws when country is missing', () => {
		expect(() => mapCsvRowToPerson({ email: 'a@b.com' })).toThrow(/country is required/i);
	});

	it('fails cleanly on malformed social_media JSON', () => {
		expect(() =>
			mapCsvRowToPerson({ country: 'US', email: 'a@b.com', social_media: '{not json' })
		).toThrow(/social_media/i);
	});

	it('omits socialMedia entirely when no blob is supplied', () => {
		const mapped = mapCsvRowToPerson({ country: 'US', email: 'a@b.com', given_name: 'Ada' });
		expect(mapped).not.toHaveProperty('socialMedia');
	});

	it('carries a valid social_media blob through', () => {
		const mapped = mapCsvRowToPerson({
			country: 'US',
			email: 'a@b.com',
			social_media: JSON.stringify({ twitter: 'ada' })
		});
		expect(mapped.socialMedia).toMatchObject({ twitter: 'ada' });
	});
});
