import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';

import { activityType } from '$lib/schema/activity/types';

export const activitySchema = v.object({
	id: helpers.uuid,
	organizationId: helpers.uuid,
	personId: helpers.uuid,
	userId: v.nullable(helpers.uuid),
	type: activityType,
	referenceId: helpers.uuid,
	unread: v.boolean(),
	createdAt: helpers.date
});
export type ActivitySchema = v.InferOutput<typeof activitySchema>;

export const activityApiSchema = v.object({
	...v.omit(activitySchema, ['organizationId']).entries,
	createdAt: helpers.dateToString
});

export const readActivityRest = v.object({
	...v.omit(activitySchema, ['organizationId']).entries,
	createdAt: helpers.dateToString
});
export type ReadActivityRest = v.InferOutput<typeof readActivityRest>;

export const readActivityZero = v.object({
	...activitySchema.entries,
	createdAt: helpers.dateToTimestamp
});
export type ReadActivityZero = v.InferOutput<typeof readActivityZero>;
