import { type CountryCode, countryCodes, defaultCountryCode } from '$lib/utils/country';
import {
	defaultOrganizationSettings,
	type OrganizationSettingsSchema
} from '$lib/schema/organization/settings';
import { type NewOrganizationFromWebsiteForm } from '$lib/schema/organization';
import { authClient } from '$lib/auth-client';
import { locale } from '$lib/index.svelte';
import { getLocalTimeZone } from '@internationalized/date';
import { httpsifyUrl } from '$lib/utils/string/domain';
import { post } from '$lib/utils/http';
import { object, boolean } from 'valibot';
export async function getCurrentCountry(): Promise<CountryCode> {
	try {
		//get the country from the IP address of the user
		const countryResponse = await fetch('https://ipwho.is/').then((res) => res.json());
		const country = countryResponse.country_code.toUpperCase() as CountryCode;
		if (countryCodes.includes(country)) {
			return country;
		} else {
			return defaultCountryCode;
		}
	} catch (err) {
		console.error(`Error getting current country: ${err}`);
		return defaultCountryCode;
	}
}

export async function createOrganization(org: NewOrganizationFromWebsiteForm) {
	const country = await getCurrentCountry();
	const languageCode = locale.current;
	const timezone = getLocalTimeZone();
	const homepageUrl = org.website ? httpsifyUrl(org.website) : null;
	const settings: OrganizationSettingsSchema = {
		...defaultOrganizationSettings(),
		website: {
			homepageUrl
		}
	};
	const balance = 0;

	const logo =
		'https://belcoda-public-prod.s3.eu-central-1.amazonaws.com/system/images/logo-full.png';
	const icon =
		org.icon ||
		'https://belcoda-public-prod.s3.eu-central-1.amazonaws.com/system/images/logo-full.png';
	const { error, data } = await authClient.organization.create({
		name: org.name,
		slug: org.slug,
		country,
		defaultLanguage: languageCode,
		defaultTimezone: timezone,
		settings,
		balance,
		logo,
		icon
	});
	if (error) {
		throw new Error(error.message);
	}

	const [active] = await Promise.all([
		authClient.organization.setActive({
			organizationId: data.id
		}),
		post({
			path: `/organization/new/onboarding`,
			schema: object({
				success: boolean()
			}),
			body: org
		}).catch((err) => {
			console.log(err);
		})
	]);

	if (active.error) {
		throw new Error(active.error.message);
	}

	return data;
}
