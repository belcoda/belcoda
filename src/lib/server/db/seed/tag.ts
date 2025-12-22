import { tag as tagTable } from '$lib/schema/drizzle';
import { selectOneOfArray } from '$lib/server/db/seed/utils';
import { faker } from '@faker-js/faker';
const tagNames = [
	'has_volunteered',
	'interest:climate',
	'interest:health',
	'interest:education',
	'interest:gender',
	'potential_donor',
	'attended:community_leadership_summit'
];

export function generateTags(organizationId: string): (typeof tagTable.$inferInsert)[] {
	const tags: (typeof tagTable.$inferInsert)[] = [];
	for (const tagName of tagNames) {
		const tag: typeof tagTable.$inferInsert = {
			id: faker.string.uuid(),
			organizationId: organizationId,
			name: tagName,
			active: true,
			createdAt: faker.date.recent({ days: 30 }),
			updatedAt: faker.date.recent({ days: 20 })
		};
		tags.push(tag);
	}
	return tags;
}
