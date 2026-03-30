import { team as teamTable } from '$lib/schema/drizzle';

import { faker } from '@faker-js/faker';
import { randomOrNull, selectOneOfArray } from '$lib/server/db/seed/utils';
export function generateTeam(
	organizationId: string,
	count: number = 5
): (typeof teamTable.$inferInsert)[] {
	const teamArr: (typeof teamTable.$inferInsert)[] = [];
	const usedNames = new Set<string>();

	for (let i = 0; i < count; i++) {
		let teamName: string;

		// Generate unique name
		let attempts = 0;
		do {
			teamName = selectOneOfArray(teams);
			attempts++;

			// If we've tried too many times with the same name, add a suffix
			if (attempts > 5) {
				teamName = `${teamName} ${faker.number.int({ min: 1, max: 999 })}`;
			}
		} while (usedNames.has(teamName));

		// Add to used set
		usedNames.add(teamName);

		const team: typeof teamTable.$inferInsert = {
			id: faker.string.uuid(),
			organizationId: organizationId,
			name: teamName,
			createdAt: faker.date.recent({ days: 30 }),
			updatedAt: faker.date.recent({ days: 20 }),
			deletedAt: randomOrNull(0.5, faker.date.recent({ days: 10 }))
		};
		teamArr.push(team);
	}
	return teamArr;
}
const teams = [
	'Coastal Solidarity Network',
	'Inland Communities Collective',
	'Southside Neighbors United',
	'Central Hills Alliance',
	'Northern Coast Organizing',
	'Far West Action Network',
	'Eastern Bays Collective',
	'Urban Justice Crew',
	'Southern Highlands Chapter',
	'Metro Organizing Group',
	'Outback Voices Network',
	'Red River Region Team',
	'Borderlands Solidarity',
	'Inner West Organizers',
	'Lakeside Community Hub',
	'Mountain Region Alliance',
	'Harbor Area Network',
	'Northern Outreach Team',
	'Valley Justice Collective',
	'City Fringe Action Group'
];
