import { countryCodes, type CountryCode } from '$lib/utils/country';
import { organization as organizationTable } from '$lib/schema/drizzle';
import { slugifyUnderscore } from '$lib/utils/slug';
import { selectOneOfArray } from '$lib/server/db/seed/utils';
import { faker } from '@faker-js/faker';
import { defaultOrganizationSettings } from '$lib/schema/organization/settings';

const { OWNER_EMAIL_ADDRESS, OWNER_ORGANIZATION_NAME, OWNER_ORGANIZATION_SLUG } = process.env;

const firstOwnerEmail = OWNER_EMAIL_ADDRESS!.split(',')[0];

export function generateOrganization({
	id,
	index = 0,
	isStressTest = false
}: {
	id: string;
	index?: number;
	isStressTest?: boolean;
}): { id: string } & typeof organizationTable.$inferInsert {
	let name: string;
	let slug: string;

	if (isStressTest) {
		name = `Stress Org ${index + 1}`;
		slug = `stress-org-${index + 1}`;
	} else {
		name = OWNER_ORGANIZATION_NAME!;
		slug = OWNER_ORGANIZATION_SLUG!;
	}

	const organization: { id: string } & typeof organizationTable.$inferInsert = {
		id: id,
		name: name,
		slug: slug,
		country: selectOneOfArray([...countryCodes]) as CountryCode,
		logo: 'https://belcoda-public-prod.s3.eu-central-1.amazonaws.com/system/images/logo-full.png',
		icon: 'https://belcoda-public-prod.s3.eu-central-1.amazonaws.com/system/images/logo-full.png',
		defaultLanguage: 'en',
		defaultTimezone: faker.location.timeZone(),
		createdAt: faker.date.recent({ days: 30 }),
		updatedAt: faker.date.recent({ days: 20 }),
		balance: 10000,
		settings: defaultOrganizationSettings()
	};
	return organization;
}
