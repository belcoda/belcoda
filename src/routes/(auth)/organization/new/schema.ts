import { slug, shortString } from '$lib/schema/helpers';
import { object } from 'valibot';

export const newOrganizationSchema = object({
	name: shortString,
	slug: slug
});
