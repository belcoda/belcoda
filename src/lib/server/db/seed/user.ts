import { user as userTable, account as accountTable } from '$lib/schema/drizzle';
import { faker } from '@faker-js/faker';
import { hashPassword } from 'better-auth/crypto';

const {
	OWNER_EMAIL_ADDRESS,
	OWNER_FAMILY_NAME,
	OWNER_GIVEN_NAME,
	OWNER_PROFILE_PIC_URL,
	OWNER_PASSWORD
} = process.env;

const EMAIL = OWNER_EMAIL_ADDRESS!.split(',');
const GIVEN_NAME = OWNER_GIVEN_NAME!.split(',');
const FAMILY_NAME = OWNER_FAMILY_NAME!.split(',');
const PROFILE_PICTURE = OWNER_PROFILE_PIC_URL!.split(',');
const PASSWORD = OWNER_PASSWORD!.split(',');
export async function generateUsers({
	organizationId,
	index = 0
}: {
	organizationId: string;
	index?: number;
}): Promise<{
	users: (typeof userTable.$inferInsert)[];
	accounts: (typeof accountTable.$inferInsert)[];
}> {
	if (
		EMAIL.length === 0 ||
		GIVEN_NAME.length === 0 ||
		FAMILY_NAME.length === 0 ||
		PROFILE_PICTURE.length === 0 ||
		PASSWORD.length === 0
	) {
		throw new Error(
			'OWNER_EMAIL_ADDRESS, OWNER_GIVEN_NAME, OWNER_FAMILY_NAME, OWNER_PROFILE_PIC_URL, OWNER_PASSWORD are not set'
		);
	}
	if (
		EMAIL.length !== GIVEN_NAME.length ||
		EMAIL.length !== FAMILY_NAME.length ||
		EMAIL.length !== PROFILE_PICTURE.length ||
		EMAIL.length !== PASSWORD.length
	) {
		throw new Error(
			'OWNER_EMAIL_ADDRESS, OWNER_GIVEN_NAME, OWNER_FAMILY_NAME, OWNER_PROFILE_PIC_URL, OWNER_PASSWORD must have the same length'
		);
	}
	const users: (typeof userTable.$inferInsert)[] = [];
	const accounts: (typeof accountTable.$inferInsert)[] = [];

	// Add the main owner account(s) from .env
	for (let i = 0; i < EMAIL.length; i++) {
		const userId = faker.string.uuid();
		const hashedPassword = await hashPassword(PASSWORD[i]);
		const account: typeof accountTable.$inferInsert = {
			id: faker.string.uuid(),
			accountId: userId, //equal to userId for credential accounts.
			providerId: 'credential',
			userId: userId,
			password: hashedPassword,
			createdAt: new Date(),
			updatedAt: new Date()
		};
		accounts.push(account);
		const user: typeof userTable.$inferInsert = {
			id: userId,
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

	return { users, accounts };
}
