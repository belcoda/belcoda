import { faker } from '@faker-js/faker';
import { v7 as uuidv7 } from 'uuid';
import { whatsappAccount as whatsappAccountTable, user as userTable } from '$lib/schema/drizzle';

type SeedUser = Pick<typeof userTable.$inferInsert, 'id' | 'name' | 'image'>;

/**
 * Generates WhatsApp accounts for an organization.
 *
 * `whatsappAccount.referenceId` is polymorphic (see drizzle.ts): for
 * organization-scoped accounts it points at the organization, and for
 * user-scoped accounts it points at the owning user.
 *
 * We create:
 *   - 1–2 organization-scoped accounts (referenceId = organizationId)
 *   - 1 user-scoped account per user (referenceId = userId), whose metadata
 *     mirrors that user's given name and profile picture
 *
 * `identifier` (the phone number / WhatsApp username) is globally unique, so we
 * track used values within a run to avoid collisions.
 */
export function generateWhatsappAccounts({
	organizationId,
	users
}: {
	organizationId: string;
	users: SeedUser[];
}): (typeof whatsappAccountTable.$inferInsert)[] {
	const usedIdentifiers = new Set<string>();

	function uniqueIdentifier(): string {
		let identifier: string;
		do {
			identifier = faker.phone.number({ style: 'international' });
		} while (usedIdentifiers.has(identifier));
		usedIdentifiers.add(identifier);
		return identifier;
	}

	const accounts: (typeof whatsappAccountTable.$inferInsert)[] = [];

	// 1–2 organization-scoped accounts
	const orgAccountCount = 1 + Math.floor(Math.random() * 2);
	for (let i = 0; i < orgAccountCount; i++) {
		accounts.push(
			buildAccount({
				scope: 'organization',
				referenceId: organizationId,
				identifier: uniqueIdentifier()
			})
		);
	}

	// one user-scoped account per user, mirroring the user's identity
	for (const user of users) {
		if (!user.id) continue;
		accounts.push(
			buildAccount({
				scope: 'user',
				referenceId: user.id,
				identifier: uniqueIdentifier(),
				user
			})
		);
	}

	return accounts;
}

const STATUS_OPTIONS = ['Available', 'At the office', 'Organizing for change ✊', 'Busy'];

function buildAccount({
	scope,
	referenceId,
	identifier,
	user
}: {
	scope: 'organization' | 'user';
	referenceId: string;
	identifier: string;
	user?: SeedUser;
}): typeof whatsappAccountTable.$inferInsert {
	const now = new Date();
	// user-scoped accounts mirror the owning user; org-scoped accounts use a business name
	const displayName = scope === 'user' ? givenNameFromUser(user) : faker.company.name();
	const profilePic = scope === 'user' && user?.image ? user.image : faker.image.avatar();
	return {
		id: uuidv7(),
		referenceId,
		scope,
		identifier,
		details: {
			provider: 'ycloud'
		},
		metadata: {
			displayName,
			isBusiness: scope === 'organization',
			profilePic,
			status: faker.helpers.arrayElement(STATUS_OPTIONS)
		},
		createdAt: now,
		updatedAt: now,
		deletedAt: null
	};
}

// user.name is a full name ("Given Family"); the account display name uses just the given name
function givenNameFromUser(user?: SeedUser): string {
	const name = user?.name?.trim();
	if (name) {
		return name.split(/\s+/)[0];
	}
	return faker.person.firstName();
}
