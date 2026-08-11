import type { WritePersonNoteMentionZero } from '$lib/schema/person-note-mention';

export type ActiveMentionQuery = {
	startIndex: number;
	endIndex: number;
	searchString: string;
};

export type NoteMentionSegment = {
	text: string;
	isMention: boolean;
};

export function splitNoteByMentions(
	note: string,
	mentions: readonly Pick<WritePersonNoteMentionZero, 'startIndex' | 'length'>[]
): NoteMentionSegment[] {
	const segments: NoteMentionSegment[] = [];
	let cursor = 0;

	for (const mention of [...mentions].sort((a, b) => a.startIndex - b.startIndex)) {
		const end = mention.startIndex + mention.length;
		if (
			mention.startIndex < cursor ||
			mention.startIndex < 0 ||
			mention.length < 1 ||
			end > note.length ||
			note[mention.startIndex] !== '@'
		) {
			continue;
		}
		if (mention.startIndex > cursor) {
			segments.push({ text: note.slice(cursor, mention.startIndex), isMention: false });
		}
		segments.push({ text: note.slice(mention.startIndex, end), isMention: true });
		cursor = end;
	}

	if (cursor < note.length || segments.length === 0) {
		segments.push({ text: note.slice(cursor), isMention: false });
	}
	return segments;
}

export function findActiveMentionQuery(
	note: string,
	cursor: number,
	mentions: readonly WritePersonNoteMentionZero[]
): ActiveMentionQuery | null {
	if (cursor < 1 || cursor > note.length) return null;

	const startIndex = note.lastIndexOf('@', cursor - 1);
	if (startIndex < 0) return null;
	const precedingCharacter = note[startIndex - 1];
	if (precedingCharacter && !/[\s([{]/u.test(precedingCharacter)) return null;

	const searchString = note.slice(startIndex + 1, cursor);
	if (!/^[\p{L}\p{N} .'-]*$/u.test(searchString)) return null;
	if (mentions.some((mention) => mention.startIndex === startIndex)) return null;

	return { startIndex, endIndex: cursor, searchString };
}

export function adjustMentionsForTextChange(
	previousNote: string,
	nextNote: string,
	mentions: readonly WritePersonNoteMentionZero[]
): WritePersonNoteMentionZero[] {
	let prefixLength = 0;
	while (
		prefixLength < previousNote.length &&
		prefixLength < nextNote.length &&
		previousNote[prefixLength] === nextNote[prefixLength]
	) {
		prefixLength += 1;
	}

	let suffixLength = 0;
	while (
		suffixLength < previousNote.length - prefixLength &&
		suffixLength < nextNote.length - prefixLength &&
		previousNote[previousNote.length - 1 - suffixLength] ===
			nextNote[nextNote.length - 1 - suffixLength]
	) {
		suffixLength += 1;
	}

	const previousChangeEnd = previousNote.length - suffixLength;
	const delta = nextNote.length - previousNote.length;

	return mentions.flatMap((mention) => {
		const mentionEnd = mention.startIndex + mention.length;
		if (previousChangeEnd <= mention.startIndex) {
			return [{ ...mention, startIndex: mention.startIndex + delta }];
		}
		if (prefixLength >= mentionEnd) return [mention];
		return [];
	});
}

export function insertMention(
	note: string,
	query: ActiveMentionQuery,
	mentions: readonly WritePersonNoteMentionZero[],
	user: { id: string; name: string },
	mentionId: string
) {
	const mentionText = `@${user.name}`;
	const nextNote = `${note.slice(0, query.startIndex)}${mentionText}${note.slice(query.endIndex)}`;
	const adjustedMentions = adjustMentionsForTextChange(note, nextNote, mentions);
	return {
		note: nextNote,
		cursor: query.startIndex + mentionText.length,
		mentions: [
			...adjustedMentions,
			{
				id: mentionId,
				mentionedUserId: user.id,
				startIndex: query.startIndex,
				length: mentionText.length
			}
		].sort((a, b) => a.startIndex - b.startIndex)
	};
}

export function adjustMentionsForTrimmedNote(
	previousNote: string,
	trimmedNote: string,
	mentions: readonly WritePersonNoteMentionZero[]
) {
	if (previousNote === trimmedNote || previousNote.trim() !== trimmedNote) return [...mentions];

	const removedFromStart = previousNote.length - previousNote.trimStart().length;
	return mentions.map((mention) => ({
		...mention,
		startIndex: mention.startIndex - removedFromStart
	}));
}
