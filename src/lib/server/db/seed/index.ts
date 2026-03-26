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

import { generateWhatsappTemplates } from '$lib/server/db/seed/whatsapp/template';

async function main() {
	console.assert(process.env.DATABASE_URL, 'DATABASE_URL is not set');
	const db = drizzle(process.env.DATABASE_URL!);
	await reset(db, schema); //reset the entire database...
	const defaultWhatsappTemplateId = uuidv7();
	const organizationId = uuidv7();
	// create organization
	const organization = await generateOrganization({
		id: organizationId,
		defaultWhatsappTemplateId
	});
	await db.insert(schema.organization).values(organization).execute();
	const whatsappTemplates = generateWhatsappTemplates(organizationId, defaultWhatsappTemplateId);
	await db.insert(schema.whatsappTemplate).values(whatsappTemplates).execute();

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

	console.log('Seeding completed successfully');
	process.exit(0);
}
main();
