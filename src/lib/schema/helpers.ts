import * as v from 'valibot';

import { checkDisallowedNames } from '$lib/utils/name';

export const uuid = v.pipe(v.string(), v.uuid());
export const SHORT_STRING_MAX_LENGTH = 100;
export const MEDIUM_STRING_MAX_LENGTH = 500;
export const LONG_STRING_MAX_LENGTH = 100000;
export const SLUG_REGEXP = new RegExp('^[a-z0-9-]+(?:-[a-z0-9]+)*$');
export const UNDERSCORE_SLUG_REGEXP = new RegExp('^[a-z0-9_]+$');

import { parsePhoneNumber } from 'awesome-phonenumber';

export const shortString = v.pipe(
	v.string(),
	v.trim(),
	v.minLength(1, 'This field is required'),
	v.maxLength(SHORT_STRING_MAX_LENGTH, `Maximum length is ${SHORT_STRING_MAX_LENGTH} characters`)
);

export const shortStringEmpty = v.pipe(
	v.string(),
	v.minLength(0),
	v.maxLength(SHORT_STRING_MAX_LENGTH, `Maximum length is ${SHORT_STRING_MAX_LENGTH} characters`)
);

export const mediumString = v.pipe(
	v.string(),
	v.trim(),
	v.minLength(1, 'This field is required'),
	v.maxLength(MEDIUM_STRING_MAX_LENGTH, `Maximum length is ${MEDIUM_STRING_MAX_LENGTH} characters`)
);
export const mediumStringEmpty = v.pipe(
	v.string(),
	v.trim(),
	v.minLength(0),
	v.maxLength(MEDIUM_STRING_MAX_LENGTH, `Maximum length is ${MEDIUM_STRING_MAX_LENGTH} characters`)
);

export const longString = v.pipe(
	v.string(),
	v.trim(),
	v.minLength(1, 'This field is required'),
	v.maxLength(LONG_STRING_MAX_LENGTH, `Maximum length is ${LONG_STRING_MAX_LENGTH} characters`)
);
export const longStringEmpty = v.pipe(
	v.string(),
	v.trim(),
	v.minLength(0),
	v.maxLength(LONG_STRING_MAX_LENGTH, `Maximum length is ${LONG_STRING_MAX_LENGTH} characters`)
);

export const slug = v.pipe(
	v.string(),
	v.trim(),
	v.minLength(1, 'This field is required'),
	v.maxLength(SHORT_STRING_MAX_LENGTH, `Maximum length is ${SHORT_STRING_MAX_LENGTH} characters`),
	v.regex(
		SLUG_REGEXP,
		'Must contain only lowercase letters, numbers, and hyphens (no consecutive hyphens)'
	)
);

export const underscoreSlug = v.pipe(
	v.string(),
	v.trim(),
	v.minLength(1, 'This field is required'),
	v.maxLength(SHORT_STRING_MAX_LENGTH, `Maximum length is ${SHORT_STRING_MAX_LENGTH} characters`),
	v.regex(UNDERSCORE_SLUG_REGEXP, 'Must contain only lowercase letters, numbers, and underscores')
);

export const workspaceSubdomain = v.pipe(
	slug,
	v.minLength(3, 'Must be at least 3 characters long'),
	v.check((input) => {
		try {
			checkDisallowedNames(input);
			return true;
		} catch (e) {
			return false;
		}
	}, 'This name is not allowed')
);

export function transformToWhatsappTemplateParamName(input: string) {
	return input
		.toLowerCase()
		.replace(/[^a-z_]/g, '_') // Replace unwanted chars with _
		.replace(/_+/g, '_') // Collapse multiple _ into one
		.replace(/^_+|_+$/g, ''); // Trim leading/trailing _
}

export const whatsappTemplateParamName = v.pipe(
	shortString,
	v.transform((input) => {
		return transformToWhatsappTemplateParamName(input);
	}),
	v.regex(/^[a-z_]+$/, 'Must contain only lowercase letters and underscores')
);

export const whatsappTemplateHeaderText = v.pipe(
	v.string(),
	v.minLength(1, 'This field is required'),
	v.maxLength(60, 'Maximum length is 60 characters') //max allowed by ycloud API
);

export const whatsappTemplateBodyText = v.pipe(
	v.string(),
	v.minLength(1, 'This field is required'),
	v.maxLength(1024, 'Maximum length is 1024 characters') //max allowed by ycloud API
);

export const whatsappTemplateButtonText = v.pipe(
	v.string(),
	v.minLength(1, 'This field is required'),
	v.maxLength(25, 'Maximum length is 25 characters')
);

export const givenName = v.nullable(mediumString);
export const familyName = v.nullable(mediumString);

export const count = v.pipe(v.number(), v.minValue(0, 'Must be a positive number'), v.integer());
export const integer = v.pipe(v.number(), v.integer());
export const unixTimestamp = v.pipe(v.number(), v.minValue(0, 'Must be a positive number'));

export const date = v.date();
export const pastDate = v.pipe(date, v.maxValue(new Date(), 'Must be in the past'));
export const dateToString = v.pipe(
	date,
	v.transform((input) => input.toISOString())
);
export const dateStringToDate = v.pipe(
	v.string(),
	v.isoDateTime(),
	v.transform((input) => new Date(input))
);
export const dateToTimestamp = v.pipe(
	date,
	v.transform((input) => input.getTime())
);
export const timestampToDate = v.pipe(
	unixTimestamp,
	v.transform((input) => new Date(input))
);

export const dateString = v.pipe(
	v.string(),
	v.minLength(10, 'Date must be in YYYY-MM-DD format'),
	v.maxLength(10, 'Date must be in YYYY-MM-DD format'),
	v.regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
);

//taken from https://github.com/fabian-hiller/valibot/pull/907/commits/27efeef44cd8f1e7e7ee37ea65e4d8c3836ab2fd
export const domainName = v.pipe(
	v.string(),
	v.minLength(1, 'Domain name is required'),
	v.maxLength(MEDIUM_STRING_MAX_LENGTH, `Maximum length is ${MEDIUM_STRING_MAX_LENGTH} characters`),
	v.regex(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,6}$/iu, 'Invalid domain name format')
);

export const email = v.pipe(
	v.string(),
	v.trim(),
	v.toLowerCase(),
	v.minLength(1, 'Email is required'),
	v.maxLength(MEDIUM_STRING_MAX_LENGTH, `Maximum length is ${MEDIUM_STRING_MAX_LENGTH} characters`),
	v.email()
);
// TODO: Add timezone validation when timezone utilities are implemented
// export const timezone = v.picklist(timezones, 'Invalid timezone');

// This regex uses a negative lookahead to ensure the email address is NOT a public email domain
// Also, using belcoda.org or belcoda.com is not allowed, because they would be automatically verified by Postmark
const PUBLIC_EMAIL_DOMAIN_REGEXP = new RegExp(
	/^(?!.*@(gmail\.com|yahoo\.com|hotmail\.com|belcoda\.org|belcoda\.com|outlook\.com|aol\.com|icloud\.com)$).+@.+\..+$/
);
export const ownedDomainEmail = v.pipe(
	email,
	v.regex(
		PUBLIC_EMAIL_DOMAIN_REGEXP,
		'Must use a company email address, not a public email service'
	)
);

import { countryCodes as countryCodeArr } from '$lib/utils/country';
export const countryCode = v.picklist([...countryCodeArr], 'Invalid country code');
export type CountryCode = v.InferOutput<typeof countryCode>;
import { languageCodes as languageCodeArray } from '$lib/utils/language';
export const languageCode = v.picklist(languageCodeArray, 'Invalid language code');
export type LanguageCode = (typeof languageCodeArray)[number];

import { genderOptions } from '$lib/utils/person';
export const gender = v.picklist(genderOptions);

export const postcode = v.pipe(
	v.string(),
	v.minLength(1, 'Postcode is required'),
	v.maxLength(40, 'Maximum length is 40 characters')
);

export const phoneNumber = v.pipe(
	v.string(),
	v.trim(),
	v.minLength(1, 'Phone number is required'),
	v.maxLength(SHORT_STRING_MAX_LENGTH, `Maximum length is ${SHORT_STRING_MAX_LENGTH} characters`),
	v.regex(
		/^\+?[0-9\s()-]+$/,
		'Phone number can only contain digits, spaces, parentheses, and hyphens'
	)
);

export const isoPhoneNumber = v.pipe(
	v.string(),
	v.check((input) => {
		const phone = parsePhoneNumber(input);
		return phone.possibility === 'is-possible';
	}, 'Invalid phone number format')
);

export const url = v.pipe(
	v.string(),
	v.trim(),
	v.minLength(1, 'URL is required'),
	v.maxLength(LONG_STRING_MAX_LENGTH, `Maximum length is ${LONG_STRING_MAX_LENGTH} characters`),
	v.url()
);

export const domainNameOrUrl = v.union([domainName, url], 'Must be a valid domain name or URL');

export const emoji = v.pipe(v.string(), v.length(1, 'Must be exactly one emoji'), v.emoji());

export const isoTimestamp = v.pipe(v.string(), v.isoTimestamp('Invalid ISO timestamp format'));

export const dbDate = v.union([
	v.pipe(v.string(), v.isoDate()),
	v.pipe(
		v.string(),
		//pattern to match YYY7-MM-DD
		v.regex(new RegExp('\\d{4}-\\d{2}-\\d{2}')),
		v.transform((input: string) => {
			new Date(input).toISOString();
		})
	),
	v.pipe(
		v.date(),
		v.transform((input) => {
			return input.toISOString();
		})
	)
]);

export const personCustomFieldSchema = v.record(
	v.string(),
	v.object({
		type: v.picklist(['text', 'number', 'date', 'boolean', 'select', 'multi-select']),
		label: shortString,
		options: v.optional(v.array(shortString))
	})
);

export function renderValiError(err: unknown):
	| {
			isValiError: true;
			message: string;
			name: string;
			stack: string | undefined;
	  }
	| { isValiError: false; error: unknown } {
	if (v.isValiError(err)) {
		let messageArr: string[] = [];
		err.issues.forEach((issue) => {
			const dotPath = v.getDotPath(issue);
			if (!dotPath) {
				messageArr.push(issue.message);
			} else {
				messageArr.push(`${dotPath} (Received: ${issue.received}): ${issue.message}`);
			}
		});
		return {
			isValiError: true,
			message: messageArr.join('; '),
			name: err.name,
			stack: err.stack
		};
	} else {
		return { isValiError: false, error: err };
	}
}

export type JsonSchema =
	| string
	| number
	| boolean
	| null
	| { [key: string]: JsonSchema }
	| JsonSchema[];

export const jsonSchema: v.GenericSchema<JsonSchema> = v.lazy(() =>
	v.union([
		v.string(),
		v.number(),
		v.boolean(),
		v.null(),
		v.record(v.string(), jsonSchema),
		v.array(jsonSchema)
	])
);

export type JsonSchemaObject = { [key: string]: JsonSchema };
export const jsonSchemaObject: v.GenericSchema<JsonSchemaObject> = v.record(v.string(), jsonSchema);

export const editorJSOutputData = v.object({
	time: v.optional(count),
	version: v.optional(shortString),
	blocks: v.array(
		v.object({
			type: shortString,
			data: v.any()
		})
	)
});
export type EditorJSOutputData = v.InferOutput<typeof editorJSOutputData>;
export function defaultEditorJSOutputData(): EditorJSOutputData {
	return {
		time: Date.now(),
		version: '2.31.0-rc.7',
		blocks: []
	};
}

export const password = v.pipe(
	v.string(),
	v.minLength(8, 'Password must be at least 8 characters long'),
	v.maxLength(800000, 'Password is too long'),
	v.regex(/[a-z]/, 'Password must contain at least one lowercase letter'),
	v.regex(/[A-Z]/, 'Password must contain at least one uppercase letter'),
	v.regex(/[0-9]/, 'Password must contain at least one number')
);

export const signupSchema = v.pipe(
	v.object({
		name: shortString,
		email: email,
		password1: password,
		password2: password
	}),
	v.forward(
		v.partialCheck(
			[['password1'], ['password2']],
			(input) => input.password1 === input.password2,
			'Passwords do not match'
		),
		['password1']
	)
);

export const confirmPasswordSchema = v.pipe(
	v.object({
		password1: password,
		password2: password
	}),
	v.forward(
		v.partialCheck(
			[['password1'], ['password2']],
			(input) => input.password1 === input.password2,
			'Passwords do not match'
		),
		['password1']
	)
);

export const loginSchema = v.object({
	email: v.string(),
	password: v.string()
});

//helper function for zero synced queries to expose a more zod-like interface which zero expects
export function parseSchema<T extends v.ObjectSchema<any, any>>(schema: T) {
	const tupleSchema = v.tuple([schema]);
	return (args: unknown[]) => {
		const parsed = v.parse(tupleSchema, args);
		return parsed;
	};
}

export const listFilter = v.object({
	searchString: v.fallback(v.nullable(v.string()), null),
	teamId: v.fallback(v.nullable(uuid), null),
	isDeleted: v.fallback(v.nullable(v.boolean()), null),
	organizationId: uuid,
	startAfter: v.fallback(v.nullable(uuid), null),
	pageSize: v.fallback(integer, 50),
	excludedIds: v.fallback(v.array(uuid), [])
});
export type ListFilter = v.InferOutput<typeof listFilter>;
