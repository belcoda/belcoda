import { describe, expect, it } from 'vitest';
import { buildPersonNoteMentionNotifications } from './notifications';

describe('buildPersonNoteMentionNotifications', () => {
	it('creates one notification per non-self mention with a stable dedupe key', () => {
		const notifications = buildPersonNoteMentionNotifications({
			organizationId: 'org-id',
			personNoteId: 'note-id',
			personId: 'person-id',
			personName: 'Maria Example',
			noteAuthorUserId: 'author-id',
			noteAuthorName: 'Ada Example',
			note: '@Ben please review this note.',
			mentions: [
				{ id: 'self-mention', mentionedUserId: 'author-id', startIndex: 0, length: 4 },
				{ id: 'ben-mention', mentionedUserId: 'ben-id', startIndex: 0, length: 4 }
			]
		});

		expect(notifications).toEqual([
			{
				type: 'person_note_mention',
				organizationId: 'org-id',
				referenceId: 'note-id',
				sourceKey: 'person_note_mention:ben-mention',
				payload: {
					personId: 'person-id',
					personName: 'Maria Example',
					noteAuthorName: 'Ada Example',
					notePreview: '@Ben please review this note.'
				},
				routing: { recipientUserIds: ['ben-id'], creatorUserId: null }
			}
		]);
	});
});
