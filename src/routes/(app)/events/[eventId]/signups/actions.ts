import type { ReadEventSignupZeroWithPerson } from '$lib/schema/event-signup';
import type { ReadEventZero } from '$lib/schema/event';

export const potentialColumns = [
	//person columns
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
	//event signup columns
	'signup.status',
	'signup.notificationSentAt',
	'signup.reminderSentAt',
	'signup.cancellationNotificationSentAt',
	'signup.createdAt'
] as const;

function isPotentialColumn(columnName: string): columnName is (typeof potentialColumns)[number] {
	return potentialColumns.includes(columnName as (typeof potentialColumns)[number]);
}

import { t } from '$lib/index.svelte';
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
		case 'signup.status':
			return t`Signup status`;
		case 'signup.notificationSentAt':
			return t`Signup notification sent at`;
		case 'signup.reminderSentAt':
			return t`Event reminder sent at`;
		case 'signup.cancellationNotificationSentAt':
			return t`Event cancellation notification sent at`;
		case 'signup.createdAt':
			return t`Signed up at`;
		default:
			return columnName;
	}
}

export const defaultColumns = [
	'person.givenName',
	'person.familyName',
	'person.email',
	'person.phone',
	'person.createdAt',
	'signup.status',
	'signup.createdAt'
];

import { getSurveyQuestions } from '$lib/components/forms/event/survey_actions';
export function generateStartingColumns(event: ReadEventZero) {
	const questions = event.settings.survey?.collections?.[0]?.questions ?? [];
	const { person, custom } = getSurveyQuestions(questions);
	return {
		person: [...defaultColumns, ...person.map((question) => question.type)],
		custom: custom
	};
}

import { renderLocalizedCountryName, type CountryCode } from '$lib/utils/country';
import { renderGender } from '$lib/utils/person/gender/render';
import type { Locale } from '$lib/utils/language';

export function renderPersonColumn({
	columnName,
	signup,
	locale
}: {
	columnName: string;
	signup: ReadEventSignupZeroWithPerson;
	locale: Locale;
}) {
	const renderers: Record<string, () => string | null | undefined> = {
		'person.givenName': () => signup.person?.givenName,
		'person.familyName': () => signup.person?.familyName,
		'person.email': () => signup.person?.emailAddress,
		'person.phone': () => signup.person?.phoneNumber,
		'person.dateOfBirth': () =>
			signup.person?.dateOfBirth ? new Date(signup.person.dateOfBirth).toLocaleDateString() : null,
		'person.gender': () => (signup.person?.gender ? renderGender(signup.person.gender) : null),
		'person.position': () => signup.person?.position,
		'person.workplace': () => signup.person?.workplace,
		'person.region': () => signup.person?.region,
		'person.postcode': () => signup.person?.postcode,
		'person.country': () =>
			signup.person?.country
				? renderLocalizedCountryName(signup.person.country as CountryCode, locale)
				: null,
		'person.createdAt': () =>
			signup.person?.createdAt ? new Date(signup.person.createdAt).toLocaleDateString() : null,
		'signup.status': () => signup.status,
		'signup.notificationSentAt': () =>
			signup.signupNotificationSentAt
				? new Date(signup.signupNotificationSentAt).toLocaleDateString()
				: null,
		'signup.reminderSentAt': () =>
			signup.reminderSentAt ? new Date(signup.reminderSentAt).toLocaleDateString() : null,
		'signup.cancellationNotificationSentAt': () =>
			signup.cancellationNotificationSentAt
				? new Date(signup.cancellationNotificationSentAt).toLocaleDateString()
				: null,
		'signup.createdAt': () =>
			signup.createdAt ? new Date(signup.createdAt).toLocaleDateString() : null
	};
	return renderers[columnName]?.();
}
