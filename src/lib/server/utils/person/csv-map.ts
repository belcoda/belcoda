import pino from '$lib/pino';
import { type CreatePerson } from '$lib/schema/person';
import { type CountryCode, isValidCountryCode } from '$lib/utils/country';
import { inputValueToDate } from '$lib/utils/date';
import { isSupportedLanguage, type LanguageCode } from '$lib/utils/language';
import { getCode } from 'country-list';
import type { SocialMedia } from '$lib/schema/person/meta';
import { getInternationalPhoneNumber } from '$lib/utils/phone';
import type { GenderOption } from '$lib/utils/person';
import { t } from '$lib/index.svelte';
import ISO6391 from 'iso-639-1';

const log = pino(import.meta.url);

/**
 * The mapped shape of a CSV row. Identical to `CreatePerson` except that
 * `preferredLanguage` may be null when the row supplies no recognizable language:
 * the insert path defaults it to 'en', while the update path leaves the existing
 * value untouched.
 */
export type CsvPersonInput = Omit<CreatePerson, 'preferredLanguage'> & {
	preferredLanguage: LanguageCode | null;
};

export interface CsvRow {
	[key: string]: string;
}

/**
 * Single source of truth for the CSV column names that map onto each person field.
 * Both the insert mapper (`mapCsvRowToPerson`) and the update presence-filter
 * (`providedFields`) read from this map, so column aliases live in exactly one place.
 *
 * Individual social-media columns (facebook, twitter, ...) are intentionally absent:
 * social media is only ever read as a whole JSON blob via the `social_media` column.
 */
export const CSV_ALIASES = {
	givenName: ['given_name', 'first_name', 'givenName', 'firstName'],
	familyName: ['family_name', 'last_name', 'familyName', 'lastName'],
	emailAddress: ['email_address', 'email', 'emailAddress'],
	phoneNumber: ['phone_number', 'phone', 'phoneNumber'],
	whatsAppUsername: ['whatsapp_username', 'whatsapp', 'whatsAppUsername'],
	workplace: ['workplace', 'organization', 'company', 'org'],
	position: ['position', 'title', 'job_title'],
	addressLine1: ['address_line_1', 'address', 'street'],
	addressLine2: ['address_line_2', 'address2'],
	locality: ['locality', 'city'],
	region: ['region', 'state', 'province'],
	postcode: ['postcode', 'zip', 'postal_code'],
	country: ['country'],
	preferredLanguage: ['preferred_language', 'language'],
	gender: ['gender'],
	dateOfBirth: ['date_of_birth', 'dob'],
	subscribed: ['email_subscribed', 'subscribed'],
	doNotContact: ['do_not_contact'],
	externalId: ['external_id', 'externalId'],
	profilePicture: ['profile_picture', 'profilePicture'],
	socialMedia: ['social_media', 'socialMedia']
} satisfies Record<string, readonly string[]>;

export type MappedField = keyof typeof CSV_ALIASES;
const MAPPED_FIELDS = Object.keys(CSV_ALIASES) as MappedField[];

/** Return the first non-empty (trimmed) value across a field's column aliases, or null. */
export function firstValue(csvRow: CsvRow, aliases: readonly string[]): string | null {
	for (const alias of aliases) {
		const value = csvRow[alias];
		if (value != null && String(value).trim() !== '') {
			return String(value).trim();
		}
	}
	return null;
}

/**
 * Which person fields did this row actually supply? A field counts as "provided"
 * only when one of its columns holds a non-empty value in this row. A blank/absent
 * cell means "leave the existing value alone" on update.
 */
export function providedFields(csvRow: CsvRow): MappedField[] {
	return MAPPED_FIELDS.filter((field) =>
		CSV_ALIASES[field].some((alias) => (csvRow[alias] ?? '').trim() !== '')
	);
}

/**
 * Social media is handled as an opt-in whole-value JSON blob rather than being
 * synthesised from individual columns. Returns undefined when no blob is present,
 * so inserts fall back to the schema default and updates leave the field untouched.
 */
export function readSocialMedia(csvRow: CsvRow): SocialMedia | undefined {
	const raw = firstValue(csvRow, CSV_ALIASES.socialMedia);
	if (!raw) return undefined;
	try {
		// Shape is validated downstream by createPerson's socialMedia schema.
		return JSON.parse(raw) as SocialMedia;
	} catch {
		throw new Error(t`Invalid social_media JSON`);
	}
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
			// Unrecognized value: return null so it is treated as "not provided" and
			// never overwrites an existing gender on update. On insert the nullable
			// personSchema.gender stores it as null.
			log.debug({ gender }, 'Unrecognized gender value, leaving unset');
			return null;
	}
}

function parseDateOfBirth(dob: string | null | undefined): Date | null {
	if (!dob) return null;

	const trimmed = dob.trim();
	if (trimmed === '') return null;

	// First try strict ISO-8601 parsing (timezone-safe)
	const strictDate = inputValueToDate(trimmed);
	if (strictDate) return strictDate;

	// Fall back to permissive parsing
	try {
		const date = new Date(trimmed);
		if (Number.isNaN(date.getTime())) return null;
		return date;
	} catch {
		return null;
	}
}

function parseCountry(csvRow: CsvRow): CountryCode {
	const raw = firstValue(csvRow, CSV_ALIASES.country);
	if (!raw) {
		throw new Error(t`Country is required`);
	}

	const lowercased = raw.toLowerCase();
	if (isValidCountryCode(lowercased)) {
		return lowercased.toUpperCase() as CountryCode;
	}

	const extractedCode = getCode(raw);
	if (extractedCode && isValidCountryCode(extractedCode)) {
		return extractedCode.toUpperCase() as CountryCode;
	}

	throw new Error(t`Invalid country: "${raw}" (must be a valid country code or country name)`);
}

function parsePreferredLanguage(csvRow: CsvRow): LanguageCode | null {
	const rawLanguage = firstValue(csvRow, CSV_ALIASES.preferredLanguage);
	if (!rawLanguage) {
		return null;
	}

	const lowercased = rawLanguage.toLocaleLowerCase();
	if (isSupportedLanguage(lowercased)) {
		return lowercased as LanguageCode;
	}

	const normalized = ISO6391.getCode(rawLanguage);
	if (normalized && isSupportedLanguage(normalized)) {
		return normalized as LanguageCode;
	}

	log.debug({ language: rawLanguage }, 'Unsupported language, leaving unset');
	return null;
}

function parsePhoneNumber(csvRow: CsvRow, country: CountryCode): string | null {
	const phoneNumber = firstValue(csvRow, CSV_ALIASES.phoneNumber);
	if (!phoneNumber) {
		return null;
	}

	return getInternationalPhoneNumber(phoneNumber, country, false);
}

/**
 * Convert a raw CSV row into a create-person input object. All fields are populated
 * (with nulls/defaults where absent) so the result validates against `createPerson`
 * on the insert path; the update path picks a subset via `providedFields`.
 *
 * Throws when `country` is missing/invalid or when a `social_media` blob is malformed.
 */
export function mapCsvRowToPerson(csvRow: CsvRow): CsvPersonInput {
	const country = parseCountry(csvRow);
	const preferredLanguage = parsePreferredLanguage(csvRow);
	const phoneNumber = parsePhoneNumber(csvRow, country);
	const socialMedia = readSocialMedia(csvRow);

	return {
		givenName: firstValue(csvRow, CSV_ALIASES.givenName),
		familyName: firstValue(csvRow, CSV_ALIASES.familyName),
		emailAddress: firstValue(csvRow, CSV_ALIASES.emailAddress),
		phoneNumber,
		whatsAppUsername: firstValue(csvRow, CSV_ALIASES.whatsAppUsername),
		workplace: firstValue(csvRow, CSV_ALIASES.workplace),
		position: firstValue(csvRow, CSV_ALIASES.position),
		addressLine1: firstValue(csvRow, CSV_ALIASES.addressLine1),
		addressLine2: firstValue(csvRow, CSV_ALIASES.addressLine2),
		locality: firstValue(csvRow, CSV_ALIASES.locality),
		region: firstValue(csvRow, CSV_ALIASES.region),
		postcode: firstValue(csvRow, CSV_ALIASES.postcode),
		country,
		preferredLanguage,
		gender: normalizeGender(firstValue(csvRow, CSV_ALIASES.gender)),
		dateOfBirth: parseDateOfBirth(firstValue(csvRow, CSV_ALIASES.dateOfBirth)),
		subscribed: parseBoolean(firstValue(csvRow, CSV_ALIASES.subscribed)),
		doNotContact: parseBoolean(firstValue(csvRow, CSV_ALIASES.doNotContact)),
		externalId: firstValue(csvRow, CSV_ALIASES.externalId),
		profilePicture: firstValue(csvRow, CSV_ALIASES.profilePicture),
		// Only include socialMedia when a blob was supplied; otherwise let the
		// create schema default it and leave it untouched on update.
		...(socialMedia !== undefined ? { socialMedia } : {})
	};
}
