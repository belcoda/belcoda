import { person } from '$lib/schema/drizzle';
import pino from '$lib/pino';
import { drizzle } from '$lib/server/db';
import { v4 as uuidv4 } from 'uuid';
import { personSchema, type PersonSchema } from '$lib/schema/person';
import { parse as valibotParse } from 'valibot';
import { type CountryCode, isValidCountryCode } from '$lib/utils/country';
import { isSupportedLanguage, type LanguageCode } from '$lib/utils/language';
import { getCode } from 'country-list';
import type { SocialMedia, PersonAddedFrom } from '$lib/schema/person/meta';
import type { GenderOption } from '$lib/utils/person';
import { t } from '$lib/index.svelte';
import Papa from 'papaparse';
import ISO6391 from 'iso-639-1';

const log = pino(import.meta.url);

interface CsvRow {
	[key: string]: string;
}

interface ImportResult {
	totalRows: number;
	successCount: number;
	failedCount: number;
	failedRows: { row: number; error: string; data?: any }[];
}

export async function parseImportCsv(
	csvString: string,
	organizationId: string,
	importId: string
): Promise<ImportResult> {
	const records: Array<{ csvRow: CsvRow; line: number }> = [];
	let successCount = 0;
	let failedCount = 0;
	const failedRows: { row: number; error: string; data?: CsvRow }[] = [];
	const parsed = Papa.parse(csvString, { header: true });
	log.debug({ numRows: parsed.data.length }, 'Parsed CSV');
	if (parsed.errors.length > 0) {
		log.error({ errors: parsed.errors }, 'CSV parsing errors');
	}
	for (const [index, row] of parsed.data.entries()) {
		const isEntirelyEmptyRow = Object.values(row as Record<string, string>).every(
			(value) => value === null || value === undefined || String(value).trim() === ''
		);

		if (!isEntirelyEmptyRow) {
			// Line 1 is the header; first data row is line 2.
			records.push({ csvRow: row as CsvRow, line: index + 2 });
		}
	}

	log.debug({ rowCount: records.length }, 'CSV parsing completed');

	for (let i = 0; i < records.length; i++) {
		const { csvRow, line } = records[i];

		try {
			const personData = mapCsvRowToPerson(csvRow, organizationId, importId);

			const personDataWithId = {
				...personData,
				id: uuidv4(),
				createdAt: new Date(),
				updatedAt: new Date(),
				deletedAt: null
			};

			try {
				const validatedPerson = valibotParse(personSchema, personDataWithId);
				try {
					await drizzle.insert(person).values(validatedPerson);
					successCount++;
					log.debug({ row: line }, 'Person imported successfully');
				} catch (error) {
					log.error({ error }, 'Database insert error');
					//if it's a postgres unique error, handle that
					failedCount++;
					const isPostgresUniqueError =
						error instanceof Error &&
						'cause' in error &&
						typeof error.cause === 'object' &&
						error.cause !== null &&
						'code' in error.cause &&
						typeof error.cause.code === 'string' &&
						error.cause.code === '23505';
					const errorMessage = isPostgresUniqueError
						? 'A person with this email address or phone number already exists'
						: 'Database insert error: Unknown error';
					failedRows.push({
						row: line,
						error: errorMessage,
						data: csvRow
					});
				}
			} catch (error) {
				failedCount++;
				const errorMessage = error instanceof Error ? error.message : 'Unknown error';
				failedRows.push({
					row: line,
					error: errorMessage,
					data: csvRow
				});
			}
		} catch (error) {
			failedCount++;
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error importing person';
			failedRows.push({
				row: line,
				error: errorMessage,
				data: csvRow
			});
			log.error({ row: line, error: errorMessage }, 'Failed to import person');
		}
	}

	return {
		totalRows: records.length,
		successCount,
		failedCount,
		failedRows
	};
}

function parseBoolean(value: string | null | undefined): boolean {
	if (!value) return false;
	const normalized = value.toLowerCase().trim();
	return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

function normalizeGender(gender: string | null | undefined): GenderOption | null {
	if (!gender) return null;

	const normalized = gender.toLowerCase().trim();

	switch (normalized) {
		case 'male':
		case 'm':
		case 'man':
		case 'boy':
			return 'male';
		case 'female':
		case 'f':
		case 'woman':
		case 'girl':
			return 'female';
		case 'other':
		case 'non-binary':
		case 'nonbinary':
		case 'nb':
		case 'genderfluid':
		case 'genderqueer':
		case 'agender':
		case 'bigender':
		case 'pangender':
		case 'polygender':
		case 'two-spirit':
		case 'twospirit':
			return 'other';
		case 'not-specified':
		case 'not specified':
		case 'unspecified':
		case 'prefer not to say':
			return 'not-specified';
		default:
			return 'not-specified';
	}
}

function parseDateOfBirth(dob: string | null | undefined): Date | null {
	if (!dob) return null;

	try {
		const date = new Date(dob);
		if (isNaN(date.getTime())) return null;
		return date;
	} catch {
		return null;
	}
}

function mapCsvRowToPerson(
	csvRow: CsvRow,
	organizationId: string,
	importId: string
): Omit<PersonSchema, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'> {
	console.log(csvRow);
	let country = csvRow['country']?.trim() || null;
	if (country) {
		const lowercased = country.toLowerCase();
		if (!isValidCountryCode(lowercased)) {
			const extractedCode = getCode(country);
			if (extractedCode && isValidCountryCode(extractedCode)) {
				country = extractedCode.toUpperCase() as CountryCode;
			} else {
				throw new Error(
					t`Invalid country: "${country}" (must be a valid country code or country name)`
				);
			}
		} else {
			country = lowercased.toUpperCase() as CountryCode;
		}
	} else {
		throw new Error(t`Country is required`);
	}

	let preferredLanguage = (
		csvRow['preferred_language'] ||
		csvRow['language'] ||
		'en'
	).toLocaleLowerCase() as LanguageCode;

	if (!isSupportedLanguage(preferredLanguage)) {
		const normalized = ISO6391.getCode(csvRow['preferred_language'] || csvRow['language']);
		if (normalized && isSupportedLanguage(normalized)) {
			preferredLanguage = normalized as LanguageCode;
		} else {
			log.debug(
				{ language: csvRow['preferred_language'] || csvRow['language'] },
				'Invalid language, using default'
			);
			preferredLanguage = 'en';
		}
	}

	const socialMedia: SocialMedia = {
		facebook: csvRow['facebook'] || null,
		twitter: csvRow['twitter'] || null,
		instagram: csvRow['instagram'] || null,
		linkedIn: csvRow['linkedIn'] || null,
		tiktok: csvRow['tiktok'] || null,
		website: csvRow['website'] || null
	};

	const addedFrom: PersonAddedFrom = {
		type: 'import',
		importId
	};

	return {
		organizationId,
		givenName:
			csvRow['given_name'] ||
			csvRow['first_name'] ||
			csvRow['givenName'] ||
			csvRow['firstName'] ||
			null,
		familyName:
			csvRow['family_name'] ||
			csvRow['last_name'] ||
			csvRow['familyName'] ||
			csvRow['lastName'] ||
			null,
		emailAddress: csvRow['email_address'] || csvRow['email'] || csvRow['emailAddress'] || null,
		phoneNumber: csvRow['phone_number'] || csvRow['phone'] || csvRow['phoneNumber'] || null,
		whatsAppUsername:
			csvRow['whatsapp_username'] || csvRow['whatsapp'] || csvRow['whatsAppUsername'] || null,
		workplace:
			csvRow['workplace'] || csvRow['organization'] || csvRow['company'] || csvRow['org'] || null,
		position: csvRow['position'] || csvRow['title'] || csvRow['job_title'] || null,
		addressLine1: csvRow['address_line_1'] || csvRow['address'] || csvRow['street'] || null,
		addressLine2: csvRow['address_line_2'] || csvRow['address2'] || null,
		locality: csvRow['locality'] || csvRow['city'] || null,
		region: csvRow['region'] || csvRow['state'] || csvRow['province'] || null,
		postcode: csvRow['postcode'] || csvRow['zip'] || csvRow['postal_code'] || null,
		country: country as CountryCode,
		preferredLanguage,
		gender: normalizeGender(csvRow['gender']),
		dateOfBirth: parseDateOfBirth(csvRow['date_of_birth'] || csvRow['dob']),
		subscribed: parseBoolean(csvRow['email_subscribed'] || csvRow['subscribed']),
		doNotContact: parseBoolean(csvRow['do_not_contact']),
		socialMedia,
		externalId: csvRow['external_id'] || csvRow['externalId'] || null,
		profilePicture: csvRow['profile_picture'] || csvRow['profilePicture'] || null,
		addedFrom,
		mostRecentActivityAt: new Date(),
		mostRecentActivityPreview: null
	};
}
