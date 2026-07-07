import { describe, it, expect } from 'vitest';
import { parse as valibotParse } from 'valibot';
import { createPerson } from '$lib/schema/person';
import { mapCsvRowToPerson, providedFields, type CsvRow } from './csv-map';

/**
 * Build the partial update payload exactly the way parseImportCsv does: map the row,
 * default preferredLanguage to 'en' for create-schema validation, then keep only the
 * fields the row supplied — gating on the *mapped* value so a field that resolves to
 * null after transformation (bad date/phone, unrecognized gender, unsupported
 * language) is left alone rather than clobbering the existing value.
 */
function buildUpdatePatch(csvRow: CsvRow): Record<string, unknown> {
	const personInput = mapCsvRowToPerson(csvRow);
	const validated = valibotParse(createPerson, {
		...personInput,
		preferredLanguage: personInput.preferredLanguage ?? 'en'
	}) as Record<string, unknown>;
	const mapped = personInput as Record<string, unknown>;
	const patch: Record<string, unknown> = {};
	for (const field of providedFields(csvRow)) {
		if (mapped[field] === null || mapped[field] === undefined) {
			continue;
		}
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

/**
 * Build the create-schema-validated values the way the parseImportCsv INSERT branch
 * does: map the row, then default preferredLanguage to 'en' before validation.
 */
function buildInsertValues(csvRow: CsvRow): Record<string, unknown> {
	const personInput = mapCsvRowToPerson(csvRow);
	return valibotParse(createPerson, {
		...personInput,
		preferredLanguage: personInput.preferredLanguage ?? 'en'
	}) as Record<string, unknown>;
}

describe('insert values construction', () => {
	it('defaults preferredLanguage to en when the row supplies none', () => {
		expect(buildInsertValues({ country: 'US', email: 'a@b.com' }).preferredLanguage).toBe('en');
	});

	it('defaults preferredLanguage to en when the supplied language is unsupported', () => {
		expect(
			buildInsertValues({ country: 'US', email: 'a@b.com', preferred_language: 'klingon' })
				.preferredLanguage
		).toBe('en');
	});

	it('keeps a supported language on insert', () => {
		expect(
			buildInsertValues({ country: 'US', email: 'a@b.com', preferred_language: 'es' })
				.preferredLanguage
		).toBe('es');
	});

	it('stores an unrecognized gender as null on insert', () => {
		expect(
			buildInsertValues({ country: 'US', email: 'a@b.com', gender: 'wizard' }).gender
		).toBeNull();
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

	it('does not clobber gender when the supplied value is unrecognized', () => {
		// A present-but-unrecognized gender must be left alone on update, not written
		// as a sentinel that would overwrite the existing value.
		const patch = buildUpdatePatch({ country: 'US', email: 'a@b.com', gender: 'wizard' });
		expect(patch).not.toHaveProperty('gender');
	});

	it('does not clobber preferredLanguage when the supplied value is unsupported', () => {
		const patch = buildUpdatePatch({
			country: 'US',
			email: 'a@b.com',
			preferred_language: 'klingon'
		});
		expect(patch).not.toHaveProperty('preferredLanguage');
	});

	it('updates gender/language when the supplied values are recognized', () => {
		const patch = buildUpdatePatch({
			country: 'US',
			email: 'a@b.com',
			gender: 'female',
			preferred_language: 'es'
		});
		expect(patch.gender).toBe('female');
		expect(patch.preferredLanguage).toBe('es');
	});

	it('does not clobber date_of_birth when the supplied value is unparseable', () => {
		const patch = buildUpdatePatch({
			country: 'US',
			email: 'a@b.com',
			date_of_birth: 'not-a-date'
		});
		expect(patch).not.toHaveProperty('dateOfBirth');
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

	it('maps unrecognized gender and unsupported/absent language to null', () => {
		expect(
			mapCsvRowToPerson({ country: 'US', email: 'a@b.com', gender: 'wizard' }).gender
		).toBeNull();
		expect(
			mapCsvRowToPerson({ country: 'US', email: 'a@b.com', preferred_language: 'klingon' })
				.preferredLanguage
		).toBeNull();
		// Absent language is also null in the mapped shape; the insert path defaults it to 'en'.
		expect(mapCsvRowToPerson({ country: 'US', email: 'a@b.com' }).preferredLanguage).toBeNull();
	});
});
