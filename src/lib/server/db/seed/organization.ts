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

const orgTypes = [
	'Alliance',
	'Coalition',
	'Collective',
	'Network',
	'Foundation',
	'Institute',
	'Initiative',
	'Project',
	'Fund',
	'Center',
	'Action',
	'Movement',
	'Partnership',
	'Assembly',
	'Council'
];

const orgTopics = [
	'Justice',
	'Equity',
	'Community',
	'Climate',
	'Housing',
	'Education',
	'Health',
	'Workers',
	'Youth',
	'Families',
	'Environment',
	'Democracy',
	'Human Rights',
	'Labor',
	'Disability',
	'Immigrant',
	'Food',
	'Water',
	'Land',
	'Peace'
];

const orgAdjectives = [
	'United',
	"People's",
	'Grassroots',
	'Community',
	'Progressive',
	'Solidarity',
	'Mutual Aid',
	'Civic',
	'Neighborhood',
	'Regional',
	'National',
	'Common',
	'Open',
	'Free',
	'New'
];

function generateOrganizationName(): string {
	const adjective = faker.helpers.arrayElement(orgAdjectives);
	const topic = faker.helpers.arrayElement(orgTopics);
	const type = faker.helpers.arrayElement(orgTypes);

	return faker.helpers.arrayElement([
		`${adjective} ${topic} ${type}`,
		`${topic} ${type}`,
		`${adjective} ${type} for ${topic}`,
		`${type} for ${topic} ${faker.helpers.arrayElement(['Action', 'Change', 'Justice', 'Now'])}`,
		`${faker.location.city()} ${topic} ${type}`
	]);
}

const firstOwnerEmail = OWNER_EMAIL_ADDRESS!.split(',')[0];

export function generateOrganization({
	defaultWhatsappTemplateId,
	id,
	index = 0,
	isStressTest = false
}: {
	defaultWhatsappTemplateId: string;
	id: string;
	index?: number;
	isStressTest?: boolean;
}): { id: string } & typeof organizationTable.$inferInsert {
	let name: string;
	let slug: string;

	if (isStressTest) {
		name = generateOrganizationName();
		slug = `${slugifyUnderscore(name)}-${id.slice(0, 8)}`.replace(/_/g, '-');
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
