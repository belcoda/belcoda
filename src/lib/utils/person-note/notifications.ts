import type { CreateNotificationSchema } from '$lib/schema/notification';
import type { WritePersonNoteMentionZero } from '$lib/schema/person-note-mention';

export function buildPersonNoteMentionNotifications({
	organizationId,
	personNoteId,
	personId,
	personName,
	noteAuthorUserId,
	noteAuthorName,
	note,
	mentions
}: {
	organizationId: string;
	personNoteId: string;
	personId: string;
	personName: string | null;
	noteAuthorUserId: string;
	noteAuthorName: string | null;
	note: string;
	mentions: readonly WritePersonNoteMentionZero[];
}): CreateNotificationSchema[] {
	const notePreview = note.slice(0, 160);

	return mentions
		.filter((mention) => mention.mentionedUserId !== noteAuthorUserId)
		.map((mention) => ({
			type: 'person_note_mention' as const,
			organizationId,
			referenceId: personNoteId,
			sourceKey: `person_note_mention:${mention.id}`,
			payload: {
				personId,
				personName,
				noteAuthorName,
				notePreview
			},
			routing: {
				recipientUserIds: [mention.mentionedUserId],
				creatorUserId: null
			}
		}));
}
