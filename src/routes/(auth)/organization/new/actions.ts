import type { CountryCode } from '$lib/utils/country';
import { defaultOrganizationSettings } from '$lib/schema/organization/settings';
import { authClient } from '$lib/auth-client';
import { locale } from '$lib/index.svelte';
export async function getCurrentCountry(): Promise<CountryCode> {
	try {
		//get the country from the IP address of the user
		const countryResponse = await fetch('https://ipwho.is/').then((res) => res.json());
		const country = countryResponse.country_code.toLowerCase() as CountryCode;
		return country;
	} catch (err) {
		console.error(`Error getting current country: ${err}`);
		return 'US';
	}
}

export async function createOrganization(name: string, slug: string) {
	const country = await getCurrentCountry();
	const languageCode = locale.current;
	const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
	const settings = defaultOrganizationSettings();
	const balance = 1;
	const createdAt = new Date();
	const updatedAt = new Date();
	const logo =
		'https://belcoda-public-prod.s3.eu-central-1.amazonaws.com/system/images/logo-full.png';
	const icon =
		'https://belcoda-public-prod.s3.eu-central-1.amazonaws.com/system/images/logo-full.png';
	const { error, data } = await authClient.organization.create({
		name,
		slug,
		//@ts-expect-error - country is not a valid property according to the better-auth schema despite it being configured in the auth server settings
		country,
		defaultLanguage: languageCode,
		defaultTimezone: timezone,
		settings,
		balance,
		createdAt,
		updatedAt,
		logo,
		icon
	});
	if (error) {
		throw new Error(error.message);
	}

	const active = await authClient.organization.setActive({
		organizationId: data.id
	});
	if (active.error) {
		throw new Error(active.error.message);
	}

	return data;
}
