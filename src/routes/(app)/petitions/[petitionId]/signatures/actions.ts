import type { ReadPetitionSignatureZeroWithPerson } from '$lib/schema/petition/petition-signature';
import type { ReadPetitionZero } from '$lib/schema/petition/petition';
import { getSurveyQuestions } from '$lib/components/forms/event/survey_actions';
import { t } from '$lib/index.svelte';
import { renderLocalizedCountryName, type CountryCode } from '$lib/utils/country';
import { renderGender } from '$lib/utils/person/gender/render';
import type { Locale } from '$lib/utils/language';

export const potentialColumns = [
	'person.givenName',
	'person.familyName',
	'person.email',
	'person.phone',
	'person.doNotContact',
	'person.addressLine1',
	'person.addressLine2',
	'person.locality',
	'person.dateOfBirth',
	'person.gender',
	'person.position',
	'person.workplace',
	'person.region',
	'person.postcode',
	'person.country',
	'person.createdAt',
	'signature.createdAt',
	'signature.channel'
] as const;

function isPotentialColumn(columnName: string): columnName is (typeof potentialColumns)[number] {
	return potentialColumns.includes(columnName as (typeof potentialColumns)[number]);
}

export function renderColumnName(columnName: string) {
	if (!isPotentialColumn(columnName)) return columnName;
	switch (columnName) {
		case 'person.givenName':
			return t`Given name`;
		case 'person.familyName':
			return t`Family name`;
		case 'person.email':
			return t`Email`;
		case 'person.phone':
			return t`Phone`;
		case 'person.doNotContact':
			return t`Do not contact`;
		case 'person.addressLine1':
			return t`Address line 1`;
		case 'person.addressLine2':
			return t`Address line 2`;
		case 'person.locality':
			return t`Locality`;
		case 'person.dateOfBirth':
			return t`Date of birth`;
		case 'person.gender':
			return t`Gender`;
		case 'person.position':
			return t`Position`;
		case 'person.workplace':
			return t`Workplace`;
		case 'person.region':
			return t`Region`;
		case 'person.postcode':
			return t`Postcode`;
		case 'person.country':
			return t`Country`;
		case 'person.createdAt':
			return t`Created at`;
		case 'signature.createdAt':
			return t`Signed at`;
		case 'signature.channel':
			return t`Channel`;
		default:
			return columnName;
	}
}

export const defaultColumns: (typeof potentialColumns)[number][] = [
	'person.givenName',
	'person.familyName',
	'person.email',
	'person.phone',
	'person.createdAt',
	'signature.createdAt'
];

export function generateStartingColumns(petition: ReadPetitionZero) {
	const questions = petition.settings.survey?.collections?.[0]?.questions ?? [];
	const { person, custom } = getSurveyQuestions(questions);
	const personColumns = [
		...new Set([...defaultColumns, ...person.map((question) => question.type)])
	];
	return {
		person: personColumns,
		custom
	};
}

/** Survey answer values on petition signatures live on `responses` (parallel to event signup `details.customFields`). */
export function formatSurveyResponseValue(value: unknown): string | null {
	if (typeof value === 'string') return value;
	if (typeof value === 'number') return value.toString();
	if (typeof value === 'boolean') return value.toString();
	if (Array.isArray(value)) return value.join(', ');
	return null;
}

export function getSignatureResponsesField(
	signature: ReadPetitionSignatureZeroWithPerson,
	questionId: string
): unknown {
	const r = signature.responses;
	if (r == null || typeof r !== 'object' || Array.isArray(r)) return undefined;
	return (r as Record<string, unknown>)[questionId];
}

/** Zero date columns may be unix seconds or milliseconds depending on row. */
function zeroTimestampToMs(ts: number): number {
	return ts < 1e11 ? ts * 1000 : ts;
}

function formatDateForLocale(ts: number | null | undefined, locale: Locale): string | null {
	if (ts == null) return null;
	return new Date(zeroTimestampToMs(ts)).toLocaleDateString(locale);
}

function renderSignatureChannel(
	type: ReadPetitionSignatureZeroWithPerson['details']['channel']['type'] | undefined
) {
	switch (type) {
		case 'petitionPage':
			return t`Petition Page`;
		case 'adminPanel':
			return t`Admin Panel`;
		case 'whatsapp':
			return t`WhatsApp`;
		default:
			return type ?? null;
	}
}

function renderDoNotContact(doNotContact: boolean | null | undefined): string | null {
	if (doNotContact === true) return t`Yes`;
	if (doNotContact === false) return t`No`;
	return null;
}

export function renderSignatureColumn({
	columnName,
	signature,
	locale
}: {
	columnName: string;
	signature: ReadPetitionSignatureZeroWithPerson;
	locale: Locale;
}) {
	switch (columnName) {
		case 'person.givenName':
			return signature.person?.givenName;
		case 'person.familyName':
			return signature.person?.familyName;
		case 'person.email':
			return signature.person?.emailAddress;
		case 'person.phone':
			return signature.person?.phoneNumber;
		case 'person.doNotContact':
			return renderDoNotContact(signature.person?.doNotContact);
		case 'person.addressLine1':
			return signature.person?.addressLine1;
		case 'person.addressLine2':
			return signature.person?.addressLine2;
		case 'person.locality':
			return signature.person?.locality;
		case 'person.dateOfBirth':
			return formatDateForLocale(signature.person?.dateOfBirth, locale);
		case 'person.gender':
			return signature.person?.gender ? renderGender(signature.person.gender) : null;
		case 'person.position':
			return signature.person?.position;
		case 'person.workplace':
			return signature.person?.workplace;
		case 'person.region':
			return signature.person?.region;
		case 'person.postcode':
			return signature.person?.postcode;
		case 'person.country':
			return signature.person?.country
				? renderLocalizedCountryName(signature.person.country as CountryCode, locale)
				: null;
		case 'person.createdAt':
			return formatDateForLocale(signature.person?.createdAt, locale);
		case 'signature.createdAt':
			return formatDateForLocale(signature.createdAt, locale);
		case 'signature.channel':
			return renderSignatureChannel(signature.details?.channel?.type);
		default:
			return undefined;
	}
}
