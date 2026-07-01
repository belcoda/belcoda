import { faker } from '@faker-js/faker';
import { v7 as uuidv7 } from 'uuid';
import { selectOneOfArray } from './utils';
import { activity as activityTable } from '$lib/schema/drizzle';
import type { ActivityType } from '$lib/schema/activity/types';

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

function selectOrRandom(ids: string[]): string {
	return ids.length > 0 ? selectOneOfArray(ids) : uuidv7();
}

function resolveReferenceId(
	activityType: ActivityType,
	ids: { eventIds: string[]; petitionIds: string[]; tagIds: string[]; teamIds: string[] }
): string {
	switch (activityType) {
		case 'event_signup':
		case 'event_attended':
		case 'event_not_attending':
		case 'event_noshow':
		case 'event_apology':
		case 'event_removed':
		case 'event_signup_email_sent':
		case 'event_reminder_email_sent':
			return selectOrRandom(ids.eventIds);
		case 'petition_signed':
		case 'petition_removed':
			return selectOrRandom(ids.petitionIds);
		case 'tag_added':
		case 'tag_removed':
			return selectOrRandom(ids.tagIds);
		case 'team_added':
		case 'team_removed':
			return selectOrRandom(ids.teamIds);
		default:
			throw new Error(`Activity type "${activityType}" is not supported in seed data`);
	}
}

function resolveUserId(userIds: string[]): string | undefined {
	if (Math.random() > 0.3 && userIds.length > 0) {
		return selectOneOfArray(userIds);
	}
	return undefined;
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
			const referenceId = resolveReferenceId(activityType, {
				eventIds,
				petitionIds,
				tagIds,
				teamIds
			});

			const activity: typeof activityTable.$inferInsert = {
				id: uuidv7(),
				organizationId,
				personId: peopleIds.length > 0 ? selectOneOfArray(peopleIds) : uuidv7(),
				userId: resolveUserId(userIds),
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
