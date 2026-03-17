import { drizzle } from 'drizzle-orm/postgres-js';
import { reset } from 'drizzle-seed';
import { generateEvents } from '$lib/server/db/seed/event';
import { generatePetitions } from '$lib/server/db/seed/petition';
import { generateTeam } from '$lib/server/db/seed/team';
import { generateUsers } from '$lib/server/db/seed/user';
import { generateOrganization } from '$lib/server/db/seed/organization';
import { generatePeople } from '$lib/server/db/seed/person';
import { generateActivities } from '$lib/server/db/seed/activity';
import * as schema from '$lib/schema/drizzle';

import { v7 as uuidv7 } from 'uuid';
import { selectOneOfArray } from './utils';
import { generateTags } from './tag';

// Helper function to generate random number within range
function randomBetween(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Type for database instance
type DbInstance = ReturnType<typeof drizzle>;

/**
 * Seed a single organization with data
 */
async function seedOrganization(
	db: DbInstance,
	organizationIndex: number,
	stressMode: boolean = false
) {
	const orgId = uuidv7();

	// Determine counts based on stress mode
	const counts = stressMode
		? {
				people: randomBetween(10000, 50000),
				events: randomBetween(250, 2500),
				petitions: randomBetween(250, 2500),
				teams: randomBetween(100, 500),
				activities: 200000
			}
		: {
				people: 50,
				events: 20,
				petitions: 15,
				teams: 5,
				activities: 100
			};

	console.log(
		`[Org ${organizationIndex + 1}] Creating org with ${counts.people} people, ${counts.events} events, ${counts.petitions} petitions, ${counts.teams} teams, ${counts.activities} activities`
	);

	// create organization
	const organization = await generateOrganization({
		id: orgId,
		index: organizationIndex,
		isStressTest: stressMode
	});
	await db.insert(schema.organization).values(organization).execute();

	// create users (always use env user as admin, plus test accounts)
	const users = await generateUsers({ organizationId: orgId, index: organizationIndex });
	await db.insert(schema.user).values(users).execute();

	// create memberships
	for (const user of users) {
		await db
			.insert(schema.member)
			.values({
				id: uuidv7(),
				userId: user.id,
				organizationId: orgId,
				role: 'owner',
				createdAt: new Date()
			})
			.execute();
	}

	// create events
	const { events, actionCodes } = await generateEvents(counts.events, {
		organizationId: orgId,
		teamId: undefined,
		pointPersonId: undefined
	});
	await db.insert(schema.event).values(events).execute();
	await db.insert(schema.actionCode).values(actionCodes).execute();

	// create petitions
	const { petitions, actionCodes: petitionActionCodes } = await generatePetitions(
		counts.petitions,
		{
			organizationId: orgId,
			teamId: undefined,
			pointPersonId: undefined
		}
	);
	await db.insert(schema.petition).values(petitions).execute();
	await db.insert(schema.actionCode).values(petitionActionCodes).execute();

	// create people
	const people = await generatePeople(counts.people, orgId);
	await db.insert(schema.person).values(people).execute();

	// create teams
	const teams = generateTeam(orgId, counts.teams);
	await db.insert(schema.team).values(teams).execute();

	// add people to teams randomly
	for (const person of people) {
		const team = selectOneOfArray(teams);
		await db
			.insert(schema.personTeam)
			.values({
				personId: person.id,
				teamId: team.id,
				organizationId: orgId,
				createdAt: new Date()
			})
			.execute();
	}

	// insert tags
	const tags = generateTags(orgId);
	await db.insert(schema.tag).values(tags).execute();

	// add tags to people randomly
	for (const person of people) {
		const tag = selectOneOfArray(tags);
		await db
			.insert(schema.personTag)
			.values({
				personId: person.id,
				tagId: tag.id,
				organizationId: orgId,
				createdAt: new Date()
			})
			.execute();
	}

	// generate activities
	const activities = generateActivities({
		organizationId: orgId,
		peopleIds: people.map((p) => p.id),
		userIds: users.map((u) => u.id),
		eventIds: events.map((e) => e.id),
		petitionIds: petitions.map((p) => p.id),
		teamIds: teams.map((t) => t.id),
		tagIds: tags.map((t) => t.id),
		count: counts.activities
	});
	await db.insert(schema.activity).values(activities).execute();
}

async function main() {
	console.assert(process.env.DATABASE_URL, 'DATABASE_URL is not set');
	const db = drizzle(process.env.DATABASE_URL!);

	// Check for --stress flag
	const isStressMode = process.argv.includes('--stress');
	const orgCount = isStressMode ? 100 : 1;

	console.log(`Starting seed in ${isStressMode ? 'STRESS' : 'NORMAL'} mode`);
	console.log(`Will create ${orgCount} organization(s)`);

	// Reset database once
	await reset(db, schema);

	// Seed organizations
	for (let i = 0; i < orgCount; i++) {
		try {
			await seedOrganization(db, i, isStressMode);
		} catch (error) {
			console.error(`Error seeding organization ${i + 1}:`, error);
			throw error;
		}
	}

	console.log('Seeding completed successfully');
	process.exit(0);
}
main();
