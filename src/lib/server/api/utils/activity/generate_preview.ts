import { type ActivityType, type ActivityPreviewPayload } from '$lib/schema/activity/types';
import { drizzle } from '$lib/server/db';

export async function generatePreview({
	type,
	referenceId
}: {
	type: ActivityType;
	referenceId: string;
}): Promise<ActivityPreviewPayload> {
	switch (type) {
		case 'tag_added': {
			const tagResult = await drizzle.query.tag.findFirst({
				where: (row, { eq }) => eq(row.id, referenceId)
			});
			if (!tagResult) {
				throw new Error('Tag not found');
			}
			return {
				type: 'tag_added',
				tagName: tagResult.name,
				tagId: tagResult.id
			};
		}
		case 'tag_removed': {
			const tagResult = await drizzle.query.tag.findFirst({
				where: (row, { eq }) => eq(row.id, referenceId)
			});
			if (!tagResult) {
				throw new Error('Tag not found');
			}
			return {
				type: 'tag_removed',
				tagName: tagResult.name,
				tagId: tagResult.id
			};
		}
		case 'team_added': {
			const teamResult = await drizzle.query.team.findFirst({
				where: (row, { eq }) => eq(row.id, referenceId)
			});
			if (!teamResult) {
				throw new Error('Team not found');
			}
			return {
				type: 'team_added',
				teamName: teamResult.name,
				teamId: teamResult.id
			};
		}
		case 'team_removed': {
			const teamResult = await drizzle.query.team.findFirst({
				where: (row, { eq }) => eq(row.id, referenceId)
			});
			if (!teamResult) {
				throw new Error('Team not found');
			}
			return {
				type: 'team_removed',
				teamName: teamResult.name,
				teamId: teamResult.id
			};
		}
		case 'note_added': {
			const noteResult = await drizzle.query.personNote.findFirst({
				where: (row, { and, eq }) => and(eq(row.id, referenceId))
			});
			if (!noteResult) {
				throw new Error('Note not found');
			}
			const userResult = await drizzle.query.user.findFirst({
				where: (row, { eq }) => eq(row.id, noteResult.userId)
			});
			if (!userResult) {
				throw new Error('User not found');
			}
			return {
				type: 'note_added',
				notePreview: noteResult.note.substring(0, 100),
				userName: userResult.name,
				noteId: noteResult.id
			};
		}
		case 'event_signup': {
			const eventSignupResult = await drizzle.query.eventSignup.findFirst({
				where: (row, { eq }) => eq(row.id, referenceId)
			});
			if (!eventSignupResult) {
				throw new Error('Event signup not found');
			}
			const eventResult = await drizzle.query.event.findFirst({
				where: (row, { eq }) => eq(row.id, eventSignupResult.eventId)
			});
			if (!eventResult) {
				throw new Error('Event not found. Cannot generate preview.');
			}
			return {
				type: 'event_signup',
				eventName: eventResult.title,
				eventId: eventResult.id
			};
		}
		case 'event_signup_email_sent': {
			const eventSignupResult = await drizzle.query.eventSignup.findFirst({
				where: (row, { eq }) => eq(row.id, referenceId)
			});
			if (!eventSignupResult) {
				throw new Error('Event signup not found');
			}
			const eventResult = await drizzle.query.event.findFirst({
				where: (row, { eq }) => eq(row.id, eventSignupResult.eventId)
			});
			if (!eventResult) {
				throw new Error('Event not found. Cannot generate preview.');
			}
			return {
				type: 'event_signup_email_sent',
				eventName: eventResult.title,
				eventId: eventResult.id
			};
		}
		case 'event_not_attending': {
			const eventSignupResult = await drizzle.query.eventSignup.findFirst({
				where: (row, { eq }) => eq(row.id, referenceId)
			});
			if (!eventSignupResult) {
				throw new Error('Event signup not found');
			}
			const eventResult = await drizzle.query.event.findFirst({
				where: (row, { eq }) => eq(row.id, eventSignupResult.eventId)
			});
			if (!eventResult) {
				throw new Error('Event not found. Cannot generate preview.');
			}
			return {
				type: 'event_not_attending',
				eventName: eventResult.title,
				eventId: eventResult.id
			};
		}
		default: {
			throw new Error(`Unsupported activity type: ${type}`);
		}
	}
}
