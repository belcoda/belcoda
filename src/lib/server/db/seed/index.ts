import { drizzle } from 'drizzle-orm/postgres-js';
import { reset } from 'drizzle-seed';
import { generateEvents } from '$lib/server/db/seed/event';
import { generatePetitions } from '$lib/server/db/seed/petition';
import { generateTeam } from '$lib/server/db/seed/team';
import { generateUsers } from '$lib/server/db/seed/user';
import { generateOrganization } from '$lib/server/db/seed/organization';
import { generatePeople } from '$lib/server/db/seed/person';
import { generateActivities } from '$lib/server/db/seed/activity';
import { generateEventSignups, generatePetitionSignatures } from '$lib/server/db/seed/signup';
import * as schema from '$lib/schema/drizzle';

import { v7 as uuidv7 } from 'uuid';
import { selectOneOfArray } from './utils';
import { generateTags } from './tag';

import { generateWhatsappTemplates } from '$lib/server/db/seed/whatsapp/template';
import { generateWhatsappAccounts } from '$lib/server/db/seed/whatsapp/account';
import { generateWhatsappMessagesWithActivities } from '$lib/server/db/seed/whatsapp/message';
import { generatePersonWhatsappIdentities } from '$lib/server/db/seed/whatsapp/identity';
import { inArray } from 'drizzle-orm';

function randomBetween(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

type DbInstance = ReturnType<typeof drizzle>;

async function seedOrganization(
	db: DbInstance,
	organizationIndex: number,
	stressMode: boolean = false
) {
	const orgId = uuidv7();
	const defaultWhatsappTemplateId = uuidv7();

	const counts = stressMode
		? {
				people: randomBetween(1000, 5000),
				events: randomBetween(50, 250),
				petitions: randomBetween(50, 250),
				teams: randomBetween(10, 50),
				activities: 50000,
				whatsappMessages: 10000
			}
		: {
				people: 50,
				events: 20,
				petitions: 15,
				teams: 5,
				activities: 100,
				whatsappMessages: 100
			};

	console.log(
		`[Org ${organizationIndex + 1}] Creating org with ${counts.people} people, ${counts.events} events, ${counts.petitions} petitions, ${counts.teams} teams, ${counts.activities} activities`
	);

	const organization = generateOrganization({
		id: orgId,
		defaultWhatsappTemplateId,
		index: organizationIndex,
		isStressTest: stressMode
	});
	await db.insert(schema.organization).values(organization).execute();
	const whatsappTemplates = generateWhatsappTemplates(orgId, defaultWhatsappTemplateId);
	await db.insert(schema.whatsappTemplate).values(whatsappTemplates).execute();

	// create users (always use env user as admin, plus test accounts)
	const { users, accounts } = await generateUsers({
		organizationId: orgId,
		index: organizationIndex
	});
	await db.insert(schema.user).values(users).execute();
	await db.insert(schema.account).values(accounts).execute();
	// create memberships
	const memberValues = users.map((user) => ({
		id: uuidv7(),
		userId: user.id,
		organizationId: orgId,
		role: 'owner' as const,
		createdAt: new Date()
	}));
	await db.insert(schema.member).values(memberValues).execute();

	// create events (in batches if large)
	const { events, actionCodes } = generateEvents(counts.events, {
		organizationId: orgId,
		teamId: undefined,
		pointPersonId: undefined
	});
	const eventBatchSize = 10;
	for (let i = 0; i < events.length; i += eventBatchSize) {
		const batch = events.slice(i, i + eventBatchSize);
		await db.insert(schema.event).values(batch).execute();
	}
	const actionCodeBatchSize = 100;
	for (let i = 0; i < actionCodes.length; i += actionCodeBatchSize) {
		const batch = actionCodes.slice(i, i + actionCodeBatchSize);
		await db.insert(schema.actionCode).values(batch).execute();
	}

	// create petitions (in batches if large)
	const { petitions, actionCodes: petitionActionCodes } = await generatePetitions(
		counts.petitions,
		{
			organizationId: orgId,
			teamId: undefined,
			pointPersonId: undefined
		}
	);
	const petitionBatchSize = 10;
	for (let i = 0; i < petitions.length; i += petitionBatchSize) {
		const batch = petitions.slice(i, i + petitionBatchSize);
		await db.insert(schema.petition).values(batch).execute();
	}
	for (let i = 0; i < petitionActionCodes.length; i += actionCodeBatchSize) {
		const batch = petitionActionCodes.slice(i, i + actionCodeBatchSize);
		await db.insert(schema.actionCode).values(batch).execute();
	}

	// create people (in batches if large)
	const people = await generatePeople(counts.people, orgId);
	const peopleBatchSize = 20;
	for (let i = 0; i < people.length; i += peopleBatchSize) {
		const batch = people.slice(i, i + peopleBatchSize);
		await db.insert(schema.person).values(batch).execute();
	}

	// create teams
	const teams = generateTeam(orgId, counts.teams);
	await db.insert(schema.team).values(teams).execute();

	// add people to teams randomly (in batches)
	const personTeamBatchSize = 100;
	const personTeamValues = [];
	for (const person of people) {
		const team = selectOneOfArray(teams);
		personTeamValues.push({
			personId: person.id,
			teamId: team.id,
			organizationId: orgId,
			createdAt: new Date()
		});
	}
	for (let i = 0; i < personTeamValues.length; i += personTeamBatchSize) {
		const batch = personTeamValues.slice(i, i + personTeamBatchSize);
		await db.insert(schema.personTeam).values(batch).execute();
	}

	// insert tags
	const tags = generateTags(orgId);
	await db.insert(schema.tag).values(tags).execute();

	// add tags to people randomly (in batches)
	const personTagBatchSize = 100;
	const personTagValues = [];
	for (const person of people) {
		const tag = selectOneOfArray(tags);
		personTagValues.push({
			personId: person.id,
			tagId: tag.id,
			organizationId: orgId,
			createdAt: new Date()
		});
	}
	for (let i = 0; i < personTagValues.length; i += personTagBatchSize) {
		const batch = personTagValues.slice(i, i + personTagBatchSize);
		await db.insert(schema.personTag).values(batch).execute();
	}

	// generate event signups and petition signatures
	const signupBatchSize = 100;
	const eventSignups = generateEventSignups(
		people.map((p) => p.id),
		events.map((e) => e.id),
		orgId
	);
	for (let i = 0; i < eventSignups.length; i += signupBatchSize) {
		await db
			.insert(schema.eventSignup)
			.values(eventSignups.slice(i, i + signupBatchSize))
			.execute();
	}

	const petitionSignatures = generatePetitionSignatures(
		people.map((p) => p.id),
		petitions.map((p) => p.id),
		orgId
	);
	for (let i = 0; i < petitionSignatures.length; i += signupBatchSize) {
		await db
			.insert(schema.petitionSignature)
			.values(petitionSignatures.slice(i, i + signupBatchSize))
			.execute();
	}

	// generate activities in batches to avoid stack overflow
	const activitiesBatchSize = 100;
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

	// Insert activities in batches
	for (let i = 0; i < activities.length; i += activitiesBatchSize) {
		const batch = activities.slice(i, i + activitiesBatchSize);
		await db.insert(schema.activity).values(batch).execute();
	}

	// create whatsapp accounts (org-scoped + one per user)
	const whatsappAccounts = generateWhatsappAccounts({
		organizationId: orgId,
		users
	});
	await db.insert(schema.whatsappAccount).values(whatsappAccounts).execute();

	// create individual (non-thread) whatsapp messages + their activity records,
	// split randomly across people and originating whatsapp accounts
	const {
		messages: whatsappMessages,
		activities: whatsappActivities,
		incomingRecipientIds
	} = generateWhatsappMessagesWithActivities({
		organizationId: orgId,
		peopleIds: people.map((p) => p.id),
		accounts: whatsappAccounts.map((a) => ({
			id: a.id,
			scope: a.scope,
			referenceId: a.referenceId
		})),
		userIds: users.map((u) => u.id),
		count: counts.whatsappMessages
	});

	// messages must be inserted before their activities (activity.referenceId -> whatsapp_message.id)
	const whatsappBatchSize = 100;
	for (let i = 0; i < whatsappMessages.length; i += whatsappBatchSize) {
		const batch = whatsappMessages.slice(i, i + whatsappBatchSize);
		await db.insert(schema.whatsappMessage).values(batch).execute();
	}
	for (let i = 0; i < whatsappActivities.length; i += whatsappBatchSize) {
		const batch = whatsappActivities.slice(i, i + whatsappBatchSize);
		await db.insert(schema.activity).values(batch).execute();
	}

	// keep the 24h customer-service window open in dev for people who received an
	// incoming message, so individual replies can be sent against seeded data
	const incomingRecipientList = [...incomingRecipientIds];
	for (let i = 0; i < incomingRecipientList.length; i += whatsappBatchSize) {
		const batch = incomingRecipientList.slice(i, i + whatsappBatchSize);
		await db
			.update(schema.person)
			.set({ mostRecentWhatsappMessageReceivedAt: new Date() })
			.where(inArray(schema.person.id, batch))
			.execute();
	}

	// create 0-2 whatsapp identities per person, guaranteeing at least one for
	// anyone with a related whatsapp message so conversations resolve a sender
	const personIdsWithMessages = new Set(
		whatsappMessages.map((m) => m.personId).filter((id): id is string => Boolean(id))
	);
	const whatsappIdentities = generatePersonWhatsappIdentities({
		organizationId: orgId,
		people,
		personIdsWithMessages
	});
	for (let i = 0; i < whatsappIdentities.length; i += whatsappBatchSize) {
		const batch = whatsappIdentities.slice(i, i + whatsappBatchSize);
		await db.insert(schema.personWhatsappIdentity).values(batch).execute();
	}
}

async function main() {
	console.assert(!!process.env.DATABASE_URL, 'DATABASE_URL is not set');
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
