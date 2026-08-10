import * as v from 'valibot';
import * as helpers from './helpers';

export const personNoteMentionSchema = v.object({
	id: helpers.uuid,
	personNoteId: helpers.uuid,
	mentionedUserId: helpers.uuid,
	startIndex: helpers.count,
	length: v.pipe(helpers.integer, v.minValue(1)),
	createdAt: helpers.date
});
export type PersonNoteMentionSchema = v.InferOutput<typeof personNoteMentionSchema>;

export const readPersonNoteMentionZero = v.object({
	...v.omit(personNoteMentionSchema, ['createdAt']).entries,
	createdAt: helpers.unixTimestamp
});
export type ReadPersonNoteMentionZero = v.InferOutput<typeof readPersonNoteMentionZero>;
