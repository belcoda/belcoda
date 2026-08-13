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

export const writePersonNoteMentionZero = v.pick(personNoteMentionSchema, [
	'id',
	'mentionedUserId',
	'startIndex',
	'length'
]);
export type WritePersonNoteMentionZero = v.InferOutput<typeof writePersonNoteMentionZero>;

export function hasValidMentionSpans(
	note: string,
	mentions: readonly WritePersonNoteMentionZero[]
) {
	const sortedMentions = [...mentions].sort((a, b) => a.startIndex - b.startIndex);
	const mentionIds = new Set<string>();
	let previousEnd = 0;

	for (const mention of sortedMentions) {
		const end = mention.startIndex + mention.length;
		if (
			mentionIds.has(mention.id) ||
			mention.startIndex < previousEnd ||
			end > note.length ||
			note[mention.startIndex] !== '@'
		) {
			return false;
		}
		mentionIds.add(mention.id);
		previousEnd = end;
	}

	return true;
}
