import { describe, expect, it } from 'vitest';
import { hasValidMentionSpans, type WritePersonNoteMentionZero } from './person-note-mention';

const userId = '019cdd3b-6c54-70d8-8ea7-8ff0f922691f';

function mention(id: string, startIndex: number, length: number): WritePersonNoteMentionZero {
	return { id, mentionedUserId: userId, startIndex, length };
}

describe('hasValidMentionSpans', () => {
	it('accepts distinct, non-overlapping mentions regardless of input order', () => {
		const note = '@Ada Lovelace, please review this with @Grace Hopper.';
		expect(
			hasValidMentionSpans(note, [
				mention('019cdd3b-6c54-70d8-8ea7-8ff0f9226920', 39, 13),
				mention('019cdd3b-6c54-70d8-8ea7-8ff0f9226921', 0, 13)
			])
		).toBe(true);
	});

	it('rejects ranges outside the note or without an @ prefix', () => {
		expect(
			hasValidMentionSpans('Ask Ada', [mention('019cdd3b-6c54-70d8-8ea7-8ff0f9226920', 4, 3)])
		).toBe(false);
		expect(
			hasValidMentionSpans('@Ada', [mention('019cdd3b-6c54-70d8-8ea7-8ff0f9226920', 0, 5)])
		).toBe(false);
	});

	it('rejects overlapping ranges and duplicate mention IDs', () => {
		const note = '@Ada @Grace';
		expect(
			hasValidMentionSpans(note, [
				mention('019cdd3b-6c54-70d8-8ea7-8ff0f9226920', 0, 6),
				mention('019cdd3b-6c54-70d8-8ea7-8ff0f9226921', 5, 6)
			])
		).toBe(false);
		expect(
			hasValidMentionSpans(note, [
				mention('019cdd3b-6c54-70d8-8ea7-8ff0f9226920', 0, 4),
				mention('019cdd3b-6c54-70d8-8ea7-8ff0f9226920', 5, 6)
			])
		).toBe(false);
	});
});
