import { user as userTable } from '$lib/schema/drizzle';
import { faker } from '@faker-js/faker';

const { OWNER_EMAIL_ADDRESS, OWNER_FAMILY_NAME, OWNER_GIVEN_NAME, OWNER_PROFILE_PIC_URL } =
	process.env;

const EMAIL = OWNER_EMAIL_ADDRESS!.split(',');
const GIVEN_NAME = OWNER_GIVEN_NAME!.split(',');
const FAMILY_NAME = OWNER_FAMILY_NAME!.split(',');
const PROFILE_PICTURE = OWNER_PROFILE_PIC_URL!.split(',');

export function generateUsers({
	organizationId,
	index = 0
}: {
	organizationId: string;
	index?: number;
}): (typeof userTable.$inferInsert)[] {
	if (
		EMAIL.length === 0 ||
		GIVEN_NAME.length === 0 ||
		FAMILY_NAME.length === 0 ||
		PROFILE_PICTURE.length === 0
	) {
		throw new Error(
			'OWNER_EMAIL_ADDRESS, OWNER_GIVEN_NAME, OWNER_FAMILY_NAME, OWNER_PROFILE_PIC_URL are not set'
		);
	}
	if (
		EMAIL.length !== GIVEN_NAME.length ||
		EMAIL.length !== FAMILY_NAME.length ||
		EMAIL.length !== PROFILE_PICTURE.length
	) {
		throw new Error(
			'OWNER_EMAIL_ADDRESS, OWNER_GIVEN_NAME, OWNER_FAMILY_NAME, OWNER_PROFILE_PIC_URL must have the same length'
		);
	}
	const users: (typeof userTable.$inferInsert)[] = [];

	// Add the main owner account(s) from .env
	for (let i = 0; i < EMAIL.length; i++) {
		const user: typeof userTable.$inferInsert = {
			id: faker.string.uuid(),
			name: `${GIVEN_NAME[i]} ${FAMILY_NAME[i]}`,
			email: EMAIL[i],
			emailVerified: true,
			image: PROFILE_PICTURE[i],
			stripeCustomerId: null,
			twoFactorEnabled: false,
			preferredLanguage: 'en',
			createdAt: new Date(),
			updatedAt: new Date()
		};
		users.push(user);
	}

	// Add test accounts with different roles for this organization
	const roles = ['member', 'admin', 'moderator'];
	for (const role of roles) {
		const user: typeof userTable.$inferInsert = {
			id: faker.string.uuid(),
			name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)} Org${index + 1}`,
			email: `test-${role}-org${index + 1}@example.com`,
			emailVerified: true,
			image: null,
			stripeCustomerId: null,
			twoFactorEnabled: false,
			preferredLanguage: 'en',
			createdAt: new Date(),
			updatedAt: new Date()
		};
		users.push(user);
	}

	return users;
}
