import { faker } from '@faker-js/faker';
import { randomOrNull } from '$lib/server/db/seed/utils';
import { countryCodes, type CountryCode } from '$lib/utils/country';
import { selectOneOfArray } from '$lib/server/db/seed/utils';
import { person as personTable } from '$lib/schema/drizzle';
import { DEFAULT_SOCIAL_MEDIA } from '$lib/schema/person/meta';
export function generatePeople(
	count: number,
	organizationId: string,
	teamId?: string
): (typeof personTable.$inferInsert)[] {
	const people: (typeof personTable.$inferInsert)[] = [];
	for (let i = 0; i < count; i++) {
		const person: typeof personTable.$inferInsert = {
			id: faker.string.uuid(),
			familyName: faker.person.lastName(),
			givenName: faker.person.firstName(),
			organizationId,
			dateOfBirth: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
			emailAddress: randomOrNull(0.5, faker.internet.email().toLocaleLowerCase()),
			profilePicture: randomOrNull(0.9, faker.image.avatar()),
			phoneNumber: randomOrNull(0.8, faker.phone.number({ style: 'international' })),
			country: selectOneOfArray([...countryCodes]) as CountryCode,
			addressLine1: randomOrNull(0.7, faker.location.streetAddress()),
			addressLine2: randomOrNull(0.01, faker.location.secondaryAddress()),
			locality: randomOrNull(0.7, faker.location.city()),
			region: faker.location.state(),
			postcode: randomOrNull(0.8, faker.location.zipCode({ format: '' })),
			preferredLanguage: 'en',
			socialMedia: DEFAULT_SOCIAL_MEDIA,
			addedFrom: {
				type: 'seeds'
			},
			createdAt: faker.date.recent({ days: 30 }),
			updatedAt: faker.date.recent({ days: 20 }),
			doNotContact: false,
			subscribed: faker.datatype.boolean(0.9),
			mostRecentActivityAt: new Date()
		};
		people.push(person);
	}
	return people;
}
