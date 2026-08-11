import { describe, expect, it } from 'vitest';
import type { WritePersonNoteMentionZero } from '$lib/schema/person-note-mention';
import {
	adjustMentionsForTextChange,
	adjustMentionsForTrimmedNote,
	findActiveMentionQuery,
	insertMention,
	splitNoteByMentions
} from './mentions';

const userId = '019cdd3b-6c54-70d8-8ea7-8ff0f922691f';
const mentionId = '019cdd3b-6c54-70d8-8ea7-8ff0f9226920';

const adaMention: WritePersonNoteMentionZero = {
	id: mentionId,
	mentionedUserId: userId,
	startIndex: 6,
	length: 4
};

describe('splitNoteByMentions', () => {
	it('splits plain text and confirmed mentions in display order', () => {
		expect(
			splitNoteByMentions('Hello @Ada and @Grace', [
				adaMention,
				{ ...adaMention, startIndex: 15, length: 6 }
			])
		).toEqual([
			{ text: 'Hello ', isMention: false },
			{ text: '@Ada', isMention: true },
			{ text: ' and ', isMention: false },
			{ text: '@Grace', isMention: true }
		]);
	});

	it('renders invalid or overlapping ranges as ordinary text', () => {
		expect(
			splitNoteByMentions('Hello @Ada', [
				{ ...adaMention, startIndex: 6, length: 4 },
				{ ...adaMention, startIndex: 7, length: 3 },
				{ ...adaMention, startIndex: 20, length: 4 }
			])
		).toEqual([
			{ text: 'Hello ', isMention: false },
			{ text: '@Ada', isMention: true }
		]);
	});
});

describe('findActiveMentionQuery', () => {
	it('finds a partial, multi-word mention at the cursor', () => {
		expect(findActiveMentionQuery('Ask @Ada L', 10, [])).toEqual({
			startIndex: 4,
			endIndex: 10,
			searchString: 'Ada L'
		});
	});

	it('ignores email addresses, punctuation, and confirmed mentions', () => {
		expect(findActiveMentionQuery('ada@example.com', 7, [])).toBeNull();
		expect(findActiveMentionQuery('Ask @Ada, then', 9, [])).toBeNull();
		expect(findActiveMentionQuery('Hello @Ada', 10, [adaMention])).toBeNull();
	});
});

describe('adjustMentionsForTextChange', () => {
	it('shifts mentions after edits and preserves edits outside their ranges', () => {
		expect(adjustMentionsForTextChange('Hello @Ada', 'Well, hello @Ada', [adaMention])).toEqual([
			{ ...adaMention, startIndex: 12 }
		]);
		expect(adjustMentionsForTextChange('Hello @Ada', 'Hello @Ada!', [adaMention])).toEqual([
			adaMention
		]);
	});

	it('removes mention metadata when its visible text is edited', () => {
		expect(adjustMentionsForTextChange('Hello @Ada', 'Hello @Ava', [adaMention])).toEqual([]);
	});
});

describe('adjustMentionsForTrimmedNote', () => {
	it('accounts for leading whitespace removed by note validation', () => {
		expect(
			adjustMentionsForTrimmedNote('  Hello @Ada  ', 'Hello @Ada', [
				{ ...adaMention, startIndex: 8 }
			])
		).toEqual([adaMention]);
	});
});

describe('insertMention', () => {
	it('replaces the active query and records the selected user span', () => {
		const result = insertMention(
			'Ask @ad tomorrow',
			{ startIndex: 4, endIndex: 7, searchString: 'ad' },
			[],
			{ id: userId, name: 'Ada Lovelace' },
			mentionId
		);
		expect(result).toEqual({
			note: 'Ask @Ada Lovelace tomorrow',
			cursor: 17,
			mentions: [
				{
					id: mentionId,
					mentionedUserId: userId,
					startIndex: 4,
					length: 13
				}
			]
		});
	});
});
