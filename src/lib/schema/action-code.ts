import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';

export const actionCodeTypes = ['event_signup', 'event_attended'] as const;
export const actionCodeType = v.picklist(actionCodeTypes);
export type ActionCodeType = v.InferOutput<typeof actionCodeType>;

export const actionCodeSchema = v.object({
	id: helpers.nanoidSchema,
	organizationId: helpers.uuid,
	referenceId: helpers.uuid,
	type: actionCodeType,
	createdAt: helpers.date,
	deletedAt: v.nullable(helpers.date)
});
export type ActionCodeSchema = v.InferOutput<typeof actionCodeSchema>;

export const readActionCodeZero = v.object({
	id: actionCodeSchema.entries.id,
	organizationId: actionCodeSchema.entries.organizationId,
	referenceId: actionCodeSchema.entries.referenceId,
	type: actionCodeSchema.entries.type,
	createdAt: helpers.unixTimestamp,
	deletedAt: v.nullable(helpers.unixTimestamp)
});
export type ReadActionCodeZero = v.InferOutput<typeof readActionCodeZero>;
