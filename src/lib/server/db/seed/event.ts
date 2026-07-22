import { faker } from '@faker-js/faker';
import { slugify } from '$lib/utils/slug';
import { generateRandomDatePairs, selectOneOfArray } from '$lib/server/db/seed/utils';
import { countryCodes } from '$lib/utils/country';
import { event as eventTable, actionCode as actionCodeTable } from '$lib/schema/drizzle';
import { v7 as uuidv7 } from 'uuid';
import { nanoid } from '$lib/schema/helpers';

type EventInsert = typeof eventTable.$inferInsert;
type GenerateEventsOptions = { organizationId: string; teamId?: string; pointPersonId?: string };

export function generateEvents(
	count: number = 50,
	options: GenerateEventsOptions
): {
	events: EventInsert[];
	actionCodes: (typeof actionCodeTable.$inferInsert)[];
} {
	const [startDates, endDates] = generateRandomDatePairs(count);
	const ids = Array.from({ length: count }, () => uuidv7());
	const getUniqueName = createUniqueNameGenerator();

	const events = ids.map((id, index) =>
		createSeedEvent(id, startDates[index], endDates[index], options, getUniqueName)
	);

	const actionCodes = generateActionCodes(events, options.organizationId);
	return { events, actionCodes };
}

function generateActionCodes(
	events: EventInsert[],
	organizationId: string
): (typeof actionCodeTable.$inferInsert)[] {
	const actionCodes: (typeof actionCodeTable.$inferInsert)[] = [];
	for (const event of events) {
		actionCodes.push(
			{
				id: nanoid(),
				organizationId,
				referenceId: event.id,
				type: 'event_signup',
				createdAt: event.createdAt
			},
			{
				id: nanoid(),
				organizationId,
				referenceId: event.id,
				type: 'event_attended',
				createdAt: event.createdAt
			}
		);
	}
	return actionCodes;
}

function createUniqueNameGenerator() {
	const usedNames = new Set<string>();
	const usedSlugs = new Set<string>();

	return (): { eventName: string; slug: string } => {
		let eventName: string;
		let slug: string;
		do {
			eventName = generateEventName();
			slug = slugify(eventName);
		} while (usedNames.has(eventName) || usedSlugs.has(slug));
		usedNames.add(eventName);
		usedSlugs.add(slug);
		return { eventName, slug };
	};
}

function createEventLocation(isOnline: boolean) {
	if (isOnline) {
		return {
			onlineLink: faker.internet.url(),
			addressLine1: null,
			addressLine2: null,
			locality: null,
			region: null,
			postcode: null
		};
	}

	return {
		onlineLink: null,
		addressLine1: faker.location.streetAddress(),
		addressLine2: faker.location.secondaryAddress(),
		locality: faker.location.city(),
		region: faker.location.state(),
		postcode: faker.location.zipCode()
	};
}

function createEventSettings(): EventInsert['settings'] {
	return {
		displayTimezone: false,
		phoneNumberRequired: false,
		survey: {
			schemaVersion: '1.0.0',
			collections: [
				{
					id: faker.string.uuid(),
					title: 'Event information',
					description: null,
					questions: [],
					nextCollectionId: null,
					previousCollectionId: null
				}
			]
		},
		whatsappFlowId: null,
		whatsappFlowYCloudId: null,
		whatsappFlowCreatedAt: null
	};
}

function createSeedEvent(
	id: string,
	startsAt: Date,
	endsAt: Date,
	options: GenerateEventsOptions,
	getUniqueName: () => { eventName: string; slug: string }
): EventInsert {
	const { eventName, slug } = getUniqueName();
	const isOnline = faker.datatype.boolean(0.5);
	const location = createEventLocation(isOnline);

	return {
		id,
		title: eventName,
		slug,
		description: null,
		shortDescription: faker.lorem.paragraph(),
		startsAt,
		endsAt,
		published: faker.datatype.boolean(),
		country: selectOneOfArray([...countryCodes]),
		...location,
		maxSignups: Math.random() > 0.9 ? faker.number.int({ min: 1, max: 100 }) : 0,
		sendReminderHoursBefore: 24,
		settings: createEventSettings(),
		signupTag: null,
		attendanceTag: null,
		timezone: faker.location.timeZone(),
		featureImage: faker.image.urlPicsumPhotos({
			width: 900,
			height: 600
		}),
		organizationId: options.organizationId,
		teamId: Math.random() > 0.5 ? options.teamId : undefined,
		createdAt: faker.date.recent({ days: 30 }),
		updatedAt: faker.date.recent({ days: 20 })
	};
}

const eventPrefixes = [
	'Annual',
	'Spring',
	'Summer',
	'Fall',
	'Winter',
	'Community',
	'Neighborhood',
	'Youth',
	'Family',
	'Virtual',
	'Hybrid',
	'Emergency',
	'First Annual',
	'Second Annual',
	'5th Anniversary',
	'10th Anniversary'
];

const eventFormats = [
	'Town Hall',
	'Community Forum',
	'Panel Discussion',
	'Workshop',
	'Training',
	'Skillshare',
	'Teach-In',
	'Conference',
	'Summit',
	'Assembly',
	'Gathering',
	'Strategy Session',
	'Rally',
	'March',
	'Day of Action',
	'Campaign Launch',
	'Fundraiser',
	'Benefit Concert',
	'Film Screening',
	'Listening Session',
	'Roundtable',
	'Potluck',
	'Block Party',
	'Volunteer Day'
];

const eventTopics = [
	'Climate Justice',
	'Housing Rights',
	'Education Equity',
	'Workers Rights',
	'Immigrant Justice',
	'Racial Justice',
	'Gender Equality',
	'LGBTQ+ Rights',
	'Disability Justice',
	'Environmental Justice',
	'Economic Justice',
	'Healthcare Access',
	'Food Security',
	'Criminal Justice Reform',
	'Voting Rights',
	'Civic Engagement',
	'Community Development',
	'Mental Health',
	'Public Education',
	'Affordable Housing',
	'Mutual Aid',
	'Clean Energy',
	'Indigenous Rights',
	'Reproductive Justice',
	'Youth Empowerment',
	'Tenant Rights',
	'Labor Organizing',
	'Police Accountability',
	'Food Justice',
	'Water Rights'
];

export function generateEventName(): string {
	const prefix = faker.helpers.arrayElement(eventPrefixes);
	const topic = faker.helpers.arrayElement(eventTopics);
	const format = faker.helpers.arrayElement(eventFormats);

	const pattern = faker.helpers.arrayElement([
		`${prefix} ${topic} ${format}`,
		`${topic} ${format}`,
		`${prefix} ${format}: ${topic}`,
		`${format}: ${topic}`,
		`${topic}: A ${format}`,
		`${prefix} ${format} for ${topic}`,
		`${format} on ${topic}`
	]);

	return pattern;
}
