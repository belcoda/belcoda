import { drizzle } from 'drizzle-orm/postgres-js';
import { reset } from 'drizzle-seed';
import { generateEvents } from '$lib/server/db/seed/event';
import { generatePetitions } from '$lib/server/db/seed/petition';
import { generateTeam } from '$lib/server/db/seed/team';
import { generateUsers } from '$lib/server/db/seed/user';
import { generateOrganization } from '$lib/server/db/seed/organization';
import { generatePeople } from '$lib/server/db/seed/person';
import * as schema from '$lib/schema/drizzle';

import { v7 as uuidv7 } from 'uuid';
import { selectOneOfArray } from './utils';
import { generateTags } from './tag';

async function main() {
	console.assert(process.env.DATABASE_URL, 'DATABASE_URL is not set');
	console.assert(process.env.PLAYWRIGHT_SESSION_ID, 'PLAYWRIGHT_SESSION_ID is not set');
	console.assert(process.env.OWNER_USER_ID_PLAYWRIGHT, 'OWNER_USER_ID_PLAYWRIGHT is not set');
	console.assert(
		process.env.OWNER_ORGANIZATION_ID_PLAYWRIGHT,
		'OWNER_ORGANIZATION_ID_PLAYWRIGHT is not set'
	);
	const db = drizzle(process.env.DATABASE_URL!);
	await reset(db, schema); //reset the entire database...

	// create organization
	const organization = await generateOrganization({
		id: process.env.OWNER_ORGANIZATION_ID_PLAYWRIGHT!
	});
	await db.insert(schema.organization).values(organization).execute();

	// create users
	const users = await generateUsers();
	await db.insert(schema.user).values(users).execute();

	// create membership of organization
	for (const user of users) {
		await db
			.insert(schema.member)
			.values({
				id: uuidv7(),
				userId: user.id,
				organizationId: organization.id,
				role: 'owner',
				createdAt: new Date()
			})
			.execute();
	}

	//create events
	const { events, actionCodes } = await generateEvents(20, {
		organizationId: organization.id,
		teamId: undefined,
		pointPersonId: undefined
	});
	await db.insert(schema.event).values(events).execute();
	await db.insert(schema.actionCode).values(actionCodes).execute();

	//create petitions
	const { petitions, actionCodes: petitionActionCodes } = await generatePetitions(15, {
		organizationId: organization.id,
		teamId: undefined,
		pointPersonId: undefined
	});
	await db.insert(schema.petition).values(petitions).execute();
	await db.insert(schema.actionCode).values(petitionActionCodes).execute();

	// create people
	const people = await generatePeople(50, organization.id);
	await db.insert(schema.person).values(people).execute();
	/* for (const person of people) {
		const activities = await generateActivity({
			personId: person.id,
			userId: users[0].id,
			organizationId: organization.id
		});
		if (activities.length > 0) {
			await db.insert(schema.activity).values(activities).execute();
		}
	} */

	// create teams
	const teams = generateTeam(organization.id);
	await db.insert(schema.team).values(teams).execute();

	//add people to teams randomly
	for (const person of people) {
		const team = selectOneOfArray(teams);
		await db
			.insert(schema.personTeam)
			.values({
				personId: person.id,
				teamId: team.id,
				organizationId: organization.id,
				createdAt: new Date()
			})
			.execute();
	}

	//inser tags
	const tags = generateTags(organization.id);
	await db.insert(schema.tag).values(tags).execute();

	//add tags to people randomly
	for (const person of people) {
		const tag = selectOneOfArray(tags);
		await db
			.insert(schema.personTag)
			.values({
				personId: person.id,
				tagId: tag.id,
				organizationId: organization.id,
				createdAt: new Date()
			})
			.execute();
	}

	//TODO: Update in better-auth branch
	const [playwrightSession] = await db
		.insert(schema.session)
		.values({
			id: process.env.PLAYWRIGHT_SESSION_ID || uuidv7(),
			userId: users[0].id,
			token: process.env.PLAYWRIGHT_SESSION_ID || uuidv7(),
			ipAddress: '127.0.0.1',
			userAgent:
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
			createdAt: new Date(),
			updatedAt: new Date(),
			expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365) // 1 year
		})
		.returning()
		.execute();

	console.log('Seeding completed successfully');
	process.exit(0);
}
main();
