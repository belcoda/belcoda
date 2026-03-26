import { countryCodes, type CountryCode } from '$lib/utils/country';
import { organization as organizationTable } from '$lib/schema/drizzle';
import { slugifyUnderscore } from '$lib/utils/slug';
import { selectOneOfArray } from '$lib/server/db/seed/utils';
import { faker } from '@faker-js/faker';
import { defaultOrganizationSettings } from '$lib/schema/organization/settings';

const {
	OWNER_EMAIL_ADDRESS,
	OWNER_ORGANIZATION_NAME,
	OWNER_ORGANIZATION_SLUG,
	SYSTEM_WABA_ID,
	DEFAULT_WHATSAPP_BUSINESS_ACCOUNT_ID,
	PUBLIC_DEFAULT_WHATSAPP_NUMBER
} = process.env;

const firstOwnerEmail = OWNER_EMAIL_ADDRESS!.split(',')[0];

export function generateOrganization({
	defaultWhatsappTemplateId,
	id
}: {
	defaultWhatsappTemplateId: string;
	id: string;
}): { id: string } & typeof organizationTable.$inferInsert {
	const name = OWNER_ORGANIZATION_NAME!;
	const organization: { id: string } & typeof organizationTable.$inferInsert = {
		id: id,
		name: 'Beltest',
		slug: 'beltest',
		country: selectOneOfArray([...countryCodes]) as CountryCode,
		logo: 'https://belcoda-public-prod.s3.eu-central-1.amazonaws.com/system/images/logo-full.png',
		icon: 'https://belcoda-public-prod.s3.eu-central-1.amazonaws.com/system/images/logo-full.png',
		defaultLanguage: 'en',
		defaultTimezone: faker.location.timeZone(),
		createdAt: faker.date.recent({ days: 30 }),
		updatedAt: faker.date.recent({ days: 20 }),
		balance: 10000,
		settings: {
			...defaultOrganizationSettings(),
			whatsApp: {
				...defaultOrganizationSettings().whatsApp,
				wabaId: DEFAULT_WHATSAPP_BUSINESS_ACCOUNT_ID || SYSTEM_WABA_ID || null,
				number: PUBLIC_DEFAULT_WHATSAPP_NUMBER || null,
				defaultTemplateId: defaultWhatsappTemplateId
			}
		}
	};
	return organization;
}
