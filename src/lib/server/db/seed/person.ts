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
	const usedEmails = new Set<string>();

	for (let i = 0; i < count; i++) {
		let emailAddress: string | null = null;

		// Generate unique email (50% chance)
		if (Math.random() < 0.5) {
			let email: string;
			let attempts = 0;
			do {
				email = faker.internet.email().toLocaleLowerCase();
				attempts++;
				// If too many collisions, use index-based email
				if (attempts > 10) {
					email = `person-${organizationId.slice(0, 8)}-${i}@example.com`;
				}
			} while (usedEmails.has(email) && attempts < 20);

			if (!usedEmails.has(email)) {
				emailAddress = email;
				usedEmails.add(email);
			}
		}

		const person: typeof personTable.$inferInsert = {
			id: faker.string.uuid(),
			familyName: faker.person.lastName(),
			givenName: faker.person.firstName(),
			organizationId,
			dateOfBirth: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
			emailAddress,
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
