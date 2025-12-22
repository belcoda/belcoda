import * as v from 'valibot';
import { shortString, slug } from '$lib/schema/helpers';
import { checkDisallowedNames } from '$lib/utils/string/names';
export const organizationNameSchema = v.pipe(
	shortString,
	v.check((input) => {
		try {
			checkDisallowedNames(input);
			return true;
		} catch (e) {
			return false;
		}
	}, 'This name is not allowed')
);
export const organizationSlugSchema = v.pipe(
	slug,
	v.check((input) => {
		try {
			checkDisallowedNames(input);
			return true;
		} catch (e) {
			return false;
		}
	}, 'This name is not allowed')
);
