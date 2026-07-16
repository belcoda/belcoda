import { faker } from '@faker-js/faker';
import { v7 as uuidv7 } from 'uuid';
import {
	personWhatsappIdentity as personWhatsappIdentityTable,
	person as personTable
} from '$lib/schema/drizzle';

type PersonRow = typeof personTable.$inferInsert;

/**
 * Generates `person_whatsapp_identity` rows for the given people.
 *
 * Each person gets 0–2 identities, except people who already have WhatsApp
 * messages related to them (`personIdsWithMessages`) — those get at least 1, so
 * every seeded conversation has a resolvable sender identity.
 *
 * The active-uniqueness constraint is on `(organizationId, wabaId, bsuid)` where
 * `deletedAt is null`. `bsuid` is generated uniquely per run, which keeps every
 * identity distinct even when they share the same WABA.
 */
export function generatePersonWhatsappIdentities({
	organizationId,
	people,
	personIdsWithMessages
}: {
	organizationId: string;
	people: PersonRow[];
	personIdsWithMessages: Set<string>;
}): (typeof personWhatsappIdentityTable.$inferInsert)[] {
	// a small pool of WABA ids for the org (identities of the same org share these)
	const wabaPool = Array.from({ length: 1 + Math.floor(Math.random() * 2) }, () =>
		faker.string.numeric(15)
	);

	const usedBsuids = new Set<string>();
	function uniqueBsuid(): string {
		let bsuid: string;
		do {
			bsuid = faker.string.numeric(16);
		} while (usedBsuids.has(bsuid));
		usedBsuids.add(bsuid);
		return bsuid;
	}

	const identities: (typeof personWhatsappIdentityTable.$inferInsert)[] = [];

	for (const person of people) {
		if (!person.id) continue;
		let count = Math.floor(Math.random() * 3); // 0, 1, or 2
		if (count === 0 && personIdsWithMessages.has(person.id)) {
			count = 1;
		}

		for (let i = 0; i < count; i++) {
			const firstSeenAt = faker.date.recent({ days: 60 });
			const lastSeenAt = faker.date.between({ from: firstSeenAt, to: new Date() });
			const displayName =
				person.givenName || person.familyName
					? `${person.givenName ?? ''} ${person.familyName ?? ''}`.trim()
					: faker.person.fullName();

			identities.push({
				id: uuidv7(),
				organizationId,
				personId: person.id,
				wabaId: faker.helpers.arrayElement(wabaPool),
				bsuid: uniqueBsuid(),
				parentUserId: faker.datatype.boolean(0.5) ? faker.string.numeric(15) : null,
				waPhone: person.phoneNumber ?? faker.phone.number({ style: 'international' }),
				displayName: faker.datatype.boolean(0.9) ? displayName : null,
				firstSeenAt,
				lastSeenAt,
				createdAt: firstSeenAt,
				updatedAt: lastSeenAt,
				deletedAt: null
			});
		}
	}

	return identities;
}
