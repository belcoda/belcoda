import { type ActivityType, type ActivityPreviewPayload } from '$lib/schema/activity/types';
import { drizzle } from '$lib/server/db';

interface LexicalNode {
	type?: unknown;
	text?: unknown;
	children?: unknown;
}

export async function generatePreview({
	type,
	referenceId
}: {
	type: ActivityType;
	referenceId: string;
}): Promise<ActivityPreviewPayload> {
	switch (type) {
		case 'tag_added':
		case 'tag_removed':
			return generateTagPreview(type, referenceId);
		case 'team_added':
		case 'team_removed':
			return generateTeamPreview(type, referenceId);
		case 'note_added':
			return generateNotePreview(referenceId);
		case 'event_signup':
		case 'event_attended':
		case 'event_signup_email_sent':
		case 'event_not_attending':
			return generateEventPreview(type, referenceId);
		case 'petition_signed':
			return generatePetitionPreview(referenceId);
		case 'email_outgoing':
			return generateEmailPreview(referenceId);
		case 'whatsapp_message_incoming':
		case 'whatsapp_message_outgoing':
			return generateWhatsappPreview(type, referenceId);
		default: {
			throw new Error(`Unsupported activity type: ${type}`);
		}
	}
}

async function generateTagPreview(
	type: 'tag_added' | 'tag_removed',
	referenceId: string
): Promise<ActivityPreviewPayload> {
	const tagResult = await drizzle.query.tag.findFirst({
		where: (row, { eq }) => eq(row.id, referenceId)
	});
	if (!tagResult) {
		throw new Error('Tag not found');
	}
	return {
		type,
		tagName: tagResult.name,
		tagId: tagResult.id
	};
}

async function generateTeamPreview(
	type: 'team_added' | 'team_removed',
	referenceId: string
): Promise<ActivityPreviewPayload> {
	const teamResult = await drizzle.query.team.findFirst({
		where: (row, { eq }) => eq(row.id, referenceId)
	});
	if (!teamResult) {
		throw new Error('Team not found');
	}
	return {
		type,
		teamName: teamResult.name,
		teamId: teamResult.id
	};
}

async function generateNotePreview(referenceId: string): Promise<ActivityPreviewPayload> {
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

async function generateEventPreview(
	type: 'event_signup' | 'event_attended' | 'event_signup_email_sent' | 'event_not_attending',
	referenceId: string
): Promise<ActivityPreviewPayload> {
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
		type,
		eventName: eventResult.title,
		eventId: eventResult.id
	};
}

async function generatePetitionPreview(referenceId: string): Promise<ActivityPreviewPayload> {
	const petitionSignatureResult = await drizzle.query.petitionSignature.findFirst({
		where: (row, { eq }) => eq(row.id, referenceId)
	});
	if (!petitionSignatureResult) {
		throw new Error('Petition signature not found');
	}
	const petitionResult = await drizzle.query.petition.findFirst({
		where: (row, { eq }) => eq(row.id, petitionSignatureResult.petitionId)
	});
	if (!petitionResult) {
		throw new Error('Petition not found. Cannot generate preview.');
	}
	return {
		type: 'petition_signed',
		petitionName: petitionResult.title,
		petitionId: petitionResult.id
	};
}

async function generateEmailPreview(referenceId: string): Promise<ActivityPreviewPayload> {
	const emailResult = await drizzle.query.emailMessage.findFirst({
		where: (row, { eq }) => eq(row.id, referenceId)
	});
	if (!emailResult) {
		throw new Error('Email message not found');
	}
	const bodyStart = extractTextFromLexical(emailResult.body);
	return {
		type: 'email_outgoing',
		subject: emailResult.subject ?? '',
		bodyStart,
		emailMessageId: emailResult.id
	};
}

async function generateWhatsappPreview(
	type: 'whatsapp_message_incoming' | 'whatsapp_message_outgoing',
	referenceId: string
): Promise<ActivityPreviewPayload> {
	const whatsappMessageResult = await drizzle.query.whatsappMessage.findFirst({
		where: (row, { eq }) => eq(row.id, referenceId)
	});
	if (!whatsappMessageResult) {
		throw new Error('Whatsapp message not found');
	}
	return {
		type,
		message: whatsappMessageResult.message,
		whatsappMessageId: whatsappMessageResult.id
	};
}

function extractTextFromLexical(body: unknown): string {
	if (!body || typeof body !== 'object') return '';
	const node = body as LexicalNode;
	let text = '';
	if (node.type === 'text' && typeof node.text === 'string') {
		text += node.text;
	}
	if (Array.isArray(node.children)) {
		for (const child of node.children) {
			text += extractTextFromLexical(child);
			if (text.length >= 100) break;
		}
	}
	return text.substring(0, 100);
}
