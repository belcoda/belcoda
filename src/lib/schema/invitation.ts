import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';

export const invitationSchema = v.object({
	id: helpers.uuid,
	email: helpers.email,
	inviterId: helpers.uuid,
	organizationId: helpers.uuid,
	teamId: v.nullable(helpers.uuid),
	role: helpers.mediumStringEmpty,
	status: helpers.mediumStringEmpty,
	createdAt: helpers.date,
	expiresAt: helpers.date
});
export type InvitationSchema = v.InferOutput<typeof invitationSchema>;

export const readInvitationRest = v.object({
	...invitationSchema.entries,
	createdAt: helpers.dateToString,
	updatedAt: helpers.dateToString
});
export type ReadInvitationRest = v.InferOutput<typeof readInvitationRest>;

export const readInvitationZero = v.object({
	...readInvitationRest.entries,
	createdAt: helpers.dateToTimestamp,
	updatedAt: helpers.dateToTimestamp
});
export type ReadInvitationZero = v.InferOutput<typeof readInvitationZero>;

//No mutator types are needed, because they are handled through the better-aut library's own API
