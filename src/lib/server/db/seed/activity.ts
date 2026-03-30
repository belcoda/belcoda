import { faker } from '@faker-js/faker';
import { v7 as uuidv7 } from 'uuid';
import { selectOneOfArray } from './utils';
import { activity as activityTable } from '$lib/schema/drizzle';
import type { ActivityType } from '$lib/schema/activity/types';
import { activityTypesList } from '$lib/schema/activity/types';

export interface ActivityGeneratorOptions {
	organizationId: string;
	peopleIds: string[];
	userIds: string[];
	eventIds: string[];
	petitionIds: string[];
	teamIds: string[];
	tagIds: string[];
	count: number;
}

export function generateActivities(
	options: ActivityGeneratorOptions
): (typeof activityTable.$inferInsert)[] {
	const { organizationId, peopleIds, userIds, eventIds, petitionIds, teamIds, tagIds, count } =
		options;

	// Weight the activity types by likelihood
	const weightedActivityTypes: { type: ActivityType; weight: number }[] = [
		{ type: 'event_signup', weight: 25 },
		{ type: 'event_attended', weight: 15 },
		{ type: 'event_not_attending', weight: 5 },
		{ type: 'event_noshow', weight: 3 },
		{ type: 'petition_signed', weight: 20 },
		{ type: 'tag_added', weight: 15 },
		{ type: 'team_added', weight: 8 },
		{ type: 'email_outgoing', weight: 5 },
		{ type: 'note_added', weight: 2 },
		{ type: 'tag_removed', weight: 1 },
		{ type: 'team_removed', weight: 1 }
	];

	// Calculate total weight for distribution
	const totalWeight = weightedActivityTypes.reduce((sum, item) => sum + item.weight, 0);

	// Calculate how many of each type to create
	const typeCounts = new Map<ActivityType, number>();
	for (const { type, weight } of weightedActivityTypes) {
		typeCounts.set(type, Math.floor((weight / totalWeight) * count));
	}

	const activities: (typeof activityTable.$inferInsert)[] = [];

	for (const [activityType, typeCount] of typeCounts.entries()) {
		for (let i = 0; i < typeCount; i++) {
			let referenceId: string | null = null;

			// Determine referenceId based on activity type
			switch (activityType) {
				case 'event_signup':
				case 'event_attended':
				case 'event_not_attending':
				case 'event_noshow':
				case 'event_apology':
				case 'event_removed':
				case 'event_signup_email_sent':
				case 'event_reminder_email_sent':
					referenceId = eventIds.length > 0 ? selectOneOfArray(eventIds) : uuidv7();
					break;
				case 'petition_signed':
				case 'petition_removed':
					referenceId = petitionIds.length > 0 ? selectOneOfArray(petitionIds) : uuidv7();
					break;
				case 'tag_added':
				case 'tag_removed':
					referenceId = tagIds.length > 0 ? selectOneOfArray(tagIds) : uuidv7();
					break;
				case 'team_added':
				case 'team_removed':
					referenceId = teamIds.length > 0 ? selectOneOfArray(teamIds) : uuidv7();
					break;
				case 'email_outgoing':
				case 'note_added':
					referenceId = uuidv7();
					break;
				default:
					referenceId = uuidv7();
			}

			const activity: typeof activityTable.$inferInsert = {
				id: uuidv7(),
				organizationId,
				personId: peopleIds.length > 0 ? selectOneOfArray(peopleIds) : uuidv7(),
				userId:
					Math.random() > 0.3
						? userIds.length > 0
							? selectOneOfArray(userIds)
							: undefined
						: undefined,
				type: activityType,
				referenceId,
				unread: Math.random() > 0.7, // 30% chance of being unread
				createdAt: faker.date.recent({ days: 30 })
			};

			activities.push(activity);
		}
	}

	return activities;
}
