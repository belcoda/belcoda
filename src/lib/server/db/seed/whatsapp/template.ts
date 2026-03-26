import { whatsappTemplate as whatsappTemplateTable } from '$lib/schema/drizzle';

export function createDefaultTemplate({
	organizationId,
	id
}: {
	organizationId: string;
	id: string;
}): typeof whatsappTemplateTable.$inferInsert {
	return {
		id,
		name: 'default_template',
		organizationId,
		components: [
			{
				type: 'BODY',
				text: 'Hi {{1}}, do you have a second to talk?',
				example: {
					body_text: [['Maria']]
				}
			}
		],
		locale: 'en',
		status: 'APPROVED',
		createdAt: new Date(),
		updatedAt: new Date()
	};
}

export function createEventInviteWithPhoto({
	organizationId,
	id
}: {
	organizationId: string;
	id: string;
}): typeof whatsappTemplateTable.$inferInsert {
	return {
		id,
		name: 'event_invite_photo',
		organizationId,
		components: [
			{
				type: 'HEADER',
				format: 'IMAGE',
				example: {
					header_url: [
						'https://belcoda-public-prod.s3.amazonaws.com/workspace/340fca96-8368-4ea3-a859-1ba93fcbc2ef/imageupload/467584c7-7499-48a6-bc3c-c94ff2cd1874-82fce495-470a-46ba-a9da-8f85310dc1fe.jpeg'
					]
				}
			},
			{
				type: 'BODY',
				text: 'INVITATION: {{1}}\n\n📆 WHEN: {{2}}\n\n📍 WHERE: {{3}}\n\nIf you’re interested in learning more, let us know.',
				example: {
					body_text: [
						[
							'#EqualityInEducation training session',
							'6pm-8pm 14 August',
							'Old Schoolhouse, 43A Newham Road'
						]
					]
				}
			},
			{
				type: 'BUTTONS',
				buttons: [
					{
						type: 'QUICK_REPLY',
						text: "I'm interested"
					},
					{
						type: 'QUICK_REPLY',
						text: "I can't come"
					}
				]
			}
		],
		locale: 'en',
		status: 'APPROVED',
		createdAt: new Date(),
		updatedAt: new Date()
	};
}

export function createEventInviteNoPhoto({
	organizationId,
	id
}: {
	organizationId: string;
	id: string;
}): typeof whatsappTemplateTable.$inferInsert {
	return {
		id,
		name: 'event_invite_no_photo',
		organizationId,
		components: [
			{
				type: 'HEADER',
				format: 'TEXT',
				text: 'INVITATION: {{1}}',
				example: {
					header_text: ['#EqualityInEducation training session']
				}
			},
			{
				type: 'BODY',
				text: '📆 WHEN: {{1}}\n\n📍 WHERE: {{2}}\n\nIf you’re interested in learning more, let us know.',
				example: {
					body_text: [['6pm-8pm 14 August', 'Old Schoolhouse, 43A Newham Road']]
				}
			},
			{
				type: 'BUTTONS',
				buttons: [
					{
						type: 'QUICK_REPLY',
						text: "I'm interested"
					},
					{
						type: 'QUICK_REPLY',
						text: "I can't come"
					}
				]
			}
		],
		locale: 'en',
		status: 'APPROVED',
		createdAt: new Date(),
		updatedAt: new Date()
	};
}

export function conversationQuestions({
	organizationId,
	id
}: {
	organizationId: string;
	id: string;
}): typeof whatsappTemplateTable.$inferInsert {
	return {
		id,
		name: 'conversation_questions',
		organizationId,
		components: [
			{
				type: 'BODY',
				text: 'Hi {{1}}, I have a few questions about {{2}}',
				example: {
					body_text: [['Maria', 'the event last week :)']]
				}
			},
			{
				type: 'BUTTONS',
				buttons: [
					{
						type: 'QUICK_REPLY',
						text: 'How can I help?'
					}
				]
			}
		],
		locale: 'en',
		status: 'APPROVED',
		createdAt: new Date(),
		updatedAt: new Date()
	};
}

export function conversationNews({
	organizationId,
	id
}: {
	organizationId: string;
	id: string;
}): typeof whatsappTemplateTable.$inferInsert {
	return {
		id,
		name: 'conversation_news',
		organizationId,
		components: [
			{
				type: 'BODY',
				text: 'Hi {{1}}, have you heard about {{2}}?',
				example: {
					body_text: [['Maria', 'our upcoming training series?']]
				}
			},
			{
				type: 'BUTTONS',
				buttons: [
					{
						type: 'QUICK_REPLY',
						text: 'Tell me more'
					}
				]
			}
		],
		locale: 'en',
		status: 'APPROVED',
		createdAt: new Date(),
		updatedAt: new Date()
	};
}

import { v7 as uuidv7 } from 'uuid';
export function generateWhatsappTemplates(
	organizationId: string,
	defaultWhatsappTemplateId: string
): (typeof whatsappTemplateTable.$inferInsert)[] {
	return [
		createDefaultTemplate({ organizationId, id: defaultWhatsappTemplateId }),
		createEventInviteWithPhoto({ organizationId, id: uuidv7() }),
		createEventInviteNoPhoto({ organizationId, id: uuidv7() }),
		conversationQuestions({ organizationId, id: uuidv7() }),
		conversationNews({ organizationId, id: uuidv7() })
	];
}
