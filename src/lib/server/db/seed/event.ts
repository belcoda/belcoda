import { faker } from '@faker-js/faker';
import { slugify } from '$lib/utils/slug';
import { generateRandomDatePairs, selectOneOfArray } from '$lib/server/db/seed/utils';
import { countryCodes } from '$lib/utils/country';
import { event as eventTable, actionCode as actionCodeTable } from '$lib/schema/drizzle';
import { v7 as uuidv7 } from 'uuid';
import { nanoid } from '$lib/schema/helpers';
export function generateEvents(
	count: number = 50,
	options: { organizationId: string; teamId?: string; pointPersonId?: string }
): {
	events: (typeof eventTable.$inferInsert)[];
	actionCodes: (typeof actionCodeTable.$inferInsert)[];
} {
	const [startDates, endDates] = generateRandomDatePairs(count);
	const ids = new Array(count).fill(0).map(() => uuidv7());
	const events: (typeof eventTable.$inferInsert)[] = [];
	const usedNames = new Set<string>();
	const usedSlugs = new Set<string>();
	for (let i = 0; i < count; i++) {
		let eventName: string;
		let slug: string;
		let isOnline = faker.datatype.boolean(0.5);

		do {
			eventName = generateEventName();
			slug = slugify(eventName);
		} while (usedNames.has(eventName) || usedSlugs.has(slug));

		usedNames.add(eventName);
		usedSlugs.add(slug);

		const event: typeof eventTable.$inferInsert = {
			id: ids[i],
			title: eventName,
			slug: slug,
			description: null,
			shortDescription: faker.lorem.paragraph(),
			startsAt: startDates[i],
			endsAt: endDates[i],
			published: faker.datatype.boolean(),
			onlineLink: isOnline ? faker.internet.url() : null,
			country: selectOneOfArray([...countryCodes]),
			addressLine1: isOnline ? null : faker.location.streetAddress(),
			addressLine2: isOnline ? null : faker.location.secondaryAddress(),
			locality: isOnline ? null : faker.location.city(),
			region: isOnline ? null : faker.location.state(),
			postcode: isOnline ? null : faker.location.zipCode(),
			maxSignups: Math.random() > 0.9 ? faker.number.int({ min: 1, max: 100 }) : 0,
			sendReminderHoursBefore: 24,
			settings: {
				displayTimezone: false,
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
			},
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
		events.push(event);
	}
	const actionCodes: (typeof actionCodeTable.$inferInsert)[] = [];
	for (let i = 0; i < events.length; i++) {
		const event = events[i];
		actionCodes.push({
			id: nanoid(),
			organizationId: options.organizationId,
			referenceId: event.id,
			type: 'event_signup',
			createdAt: event.createdAt
		});
		actionCodes.push({
			id: nanoid(),
			organizationId: options.organizationId,
			referenceId: event.id,
			type: 'event_attended',
			createdAt: event.createdAt
		});
	}
	return { events, actionCodes };
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
