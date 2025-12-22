import { renderLocalizedCountryName, type CountryCode } from '../country';
import type { Locale } from '../language';

export function renderAddress({
	addressLine1,
	addressLine2,
	locality,
	region,
	postcode,
	country,
	locale
}: {
	addressLine1: string | null | undefined;
	addressLine2: string | null | undefined;
	locality: string | null | undefined;
	region: string | null | undefined;
	country: string;
	postcode: string | null | undefined;
	locale: Locale;
}) {
	// Output a renderred address string based on values which may or may not be present
	// in the addressLine1, addressLine2, locality, region, postcode and country fields.

	//TODO: Fix country code to be a name
	const addressParts = [
		addressLine1,
		addressLine2,
		locality,
		region,
		postcode,
		renderLocalizedCountryName(country as CountryCode, locale as Locale)
	].filter(Boolean) as string[];
	return addressParts.join(', ');
}

export function isAddressComplete({
	addressLine1,
	addressLine2,
	locality,
	region,
	postcode
}: {
	addressLine1: string | null | undefined;
	addressLine2: string | null | undefined;
	locality: string | null | undefined;
	region: string | null | undefined;
	postcode: string | null | undefined;
}) {
	return !!addressLine1 || !!addressLine2 || !!locality || !!region || !!postcode;
}
