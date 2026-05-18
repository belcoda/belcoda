import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';

export const personWhatsappIdentitySchema = v.object({
	id: helpers.uuid,
	organizationId: helpers.uuid,
	personId: helpers.uuid,
	wabaId: helpers.mediumString,
	bsuid: helpers.mediumString,
	parentUserId: v.nullable(helpers.mediumString),
	waPhone: v.nullable(helpers.phoneNumber),
	displayName: v.nullable(helpers.mediumString),
	firstSeenAt: helpers.date,
	lastSeenAt: helpers.date,
	createdAt: helpers.date,
	updatedAt: helpers.date,
	deletedAt: v.nullable(helpers.date)
});
export type PersonWhatsappIdentitySchema = v.InferOutput<typeof personWhatsappIdentitySchema>;

export const readPersonWhatsappIdentityZero = v.object({
	...personWhatsappIdentitySchema.entries,
	firstSeenAt: helpers.dateToTimestamp,
	lastSeenAt: helpers.dateToTimestamp,
	createdAt: helpers.dateToTimestamp,
	updatedAt: helpers.dateToTimestamp,
	deletedAt: v.nullable(helpers.dateToTimestamp)
});
export type ReadPersonWhatsappIdentityZero = v.InferOutput<typeof readPersonWhatsappIdentityZero>;
