import { parse } from 'valibot';
import { slug } from '$lib/schema/helpers';
//taken from https://dev.to/bybydev/how-to-slugify-a-string-in-javascript-4o9n
export function slugify(str: string) {
	str = str.replace(/^\s+|\s+$/g, ''); // trim leading/trailing white space
	if (str.length === 0) {
		return '';
	}
	str = str.toLowerCase(); // convert string to lowercase
	str = str
		.replace(/[^a-z0-9 -]/g, '') // remove any non-alphanumeric characters
		.replace(/\s+/g, '-') // replace spaces with hyphens
		.replace(/-+/g, '-'); // remove consecutive hyphens
	return parse(slug, str);
}

export function slugifyUnderscore(str: string) {
	str = str.replace(/^\s+|\s+$/g, ''); // trim leading/trailing white space
	if (str.length === 0) {
		return '';
	}
	str = str.toLowerCase(); // convert string to lowercase
	str = str
		.replace(/[^a-z0-9\s-_]/g, '') // remove any non-alphanumeric characters (except spaces, hyphens, and underscores)
		.replace(/[\s-]+/g, '_') // replace spaces and hyphens with underscores
		.replace(/_+/g, '_'); // replace consecutive underscores with single underscore
	return str;
}
