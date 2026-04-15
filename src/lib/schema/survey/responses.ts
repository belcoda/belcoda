import { record, string, number, boolean, array, union, nullable } from 'valibot';

export const surveyResponsesSchema = record(
	string(),
	nullable(union([string(), number(), boolean(), array(string())]))
);
