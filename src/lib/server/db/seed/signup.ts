import { faker } from '@faker-js/faker';
import { v7 as uuidv7 } from 'uuid';
import {
	eventSignup as eventSignupTable,
	petitionSignature as petitionSignatureTable
} from '$lib/schema/drizzle';

export function generateEventSignups(
	peopleIds: string[],
	eventIds: string[],
	organizationId: string
): (typeof eventSignupTable.$inferInsert)[] {
	const signupCount = Math.min(
		randomBetween(10, Math.max(10, Math.floor(peopleIds.length * 0.3))),
		500
	);

	const signups: (typeof eventSignupTable.$inferInsert)[] = [];
	const used = new Set<string>();

	let attempts = 0;
	while (signups.length < signupCount && attempts < signupCount * 5) {
		attempts++;
		const personId = faker.helpers.arrayElement(peopleIds);
		const eventId = faker.helpers.arrayElement(eventIds);
		const key = `${eventId}:${personId}`;
		if (used.has(key)) continue;
		used.add(key);

		const createdAt = faker.date.recent({ days: 60 });
		signups.push({
			id: uuidv7(),
			organizationId,
			eventId,
			personId,
			details: { channel: { type: 'eventPage' }, customFields: {} },
			status: faker.helpers.weightedArrayElement([
				{ value: 'signup', weight: 5 },
				{ value: 'attended', weight: 3 },
				{ value: 'noshow', weight: 1 },
				{ value: 'cancelled', weight: 1 }
			]),
			signupNotificationSentAt: null,
			reminderSentAt: null,
			cancellationNotificationSentAt: null,
			createdAt,
			updatedAt: createdAt
		});
	}

	return signups;
}

export function generatePetitionSignatures(
	peopleIds: string[],
	petitionIds: string[],
	organizationId: string
): (typeof petitionSignatureTable.$inferInsert)[] {
	const signatureCount = Math.min(
		randomBetween(10, Math.max(10, Math.floor(peopleIds.length * 0.4))),
		500
	);

	const signatures: (typeof petitionSignatureTable.$inferInsert)[] = [];
	const used = new Set<string>();

	let attempts = 0;
	while (signatures.length < signatureCount && attempts < signatureCount * 5) {
		attempts++;
		const personId = faker.helpers.arrayElement(peopleIds);
		const petitionId = faker.helpers.arrayElement(petitionIds);
		const key = `${petitionId}:${personId}`;
		if (used.has(key)) continue;
		used.add(key);

		const createdAt = faker.date.recent({ days: 90 });
		signatures.push({
			id: uuidv7(),
			organizationId,
			teamId: null,
			petitionId,
			personId,
			details: { channel: { type: 'petitionPage' } },
			responses: null,
			createdAt,
			updatedAt: createdAt,
			deletedAt: null
		});
	}

	return signatures;
}

function randomBetween(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}
