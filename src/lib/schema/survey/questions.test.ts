import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import { getSurveySchema, type SurveyQuestion } from './questions';

const requiredWorkplaceQuestion: SurveyQuestion = {
	id: '00000000-0000-4000-8000-000000000001',
	type: 'person.workplace',
	label: 'Workplace',
	required: true
};

const optionalWorkplaceQuestion: SurveyQuestion = {
	...requiredWorkplaceQuestion,
	required: false
};

function buildSurvey(questions: SurveyQuestion[]) {
	return {
		settings: {
			survey: {
				schemaVersion: '1.0.0' as const,
				collections: [
					{
						id: '00000000-0000-4000-8000-000000000000',
						title: 'Signup information',
						description: null,
						questions,
						nextCollectionId: null,
						previousCollectionId: null
					}
				]
			}
		}
	};
}

const validSignup = {
	person: {
		givenName: 'Ada',
		emailAddress: 'ada@example.com',
		country: 'US'
	},
	customFields: {}
};

describe('getSurveySchema', () => {
	it('requires selected standard person fields when marked required', () => {
		const schema = getSurveySchema(buildSurvey([requiredWorkplaceQuestion]));

		expect(v.safeParse(schema, validSignup).success).toBe(false);
		expect(
			v.safeParse(schema, {
				...validSignup,
				person: {
					...validSignup.person,
					workplace: 'Belcoda'
				}
			}).success
		).toBe(true);
	});

	it('keeps selected standard person fields optional when not marked required', () => {
		const schema = getSurveySchema(buildSurvey([optionalWorkplaceQuestion]));

		expect(v.safeParse(schema, validSignup).success).toBe(true);
	});
});
