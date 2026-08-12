import { describe, expect, it } from 'vitest';
import { buildDigestContext } from './digest_context';

type NotificationInput = Parameters<typeof buildDigestContext>[0]['notifications'][number];

const organizationId = 'f7568d08-edf4-4860-9f71-857f816d6d1f';
const personId = '7010f2b4-7907-45cb-a848-1ace5b7ca981';

function buildContext(notifications: NotificationInput[]) {
	return buildDigestContext({
		notifications,
		organizationName: 'Belcoda',
		organizationId,
		weekOf: '2026-08-10',
		appUrl: 'https://app.example.com'
	});
}

describe('buildDigestContext', () => {
	it('uses payload personId for note mention links when personName is missing', () => {
		const context = buildContext([
			{
				id: 'note-mention-1',
				type: 'person_note_mention',
				referenceId: '95c0dd4a-85e4-4712-a47c-ce19c7b6118f',
				payload: {
					personId,
					personName: null,
					noteAuthorName: 'A teammate',
					notePreview: 'You were mentioned.'
				}
			}
		]);

		expect(context.sections[0]?.items[0]?.url).toBe(
			`https://app.example.com/community/${personId}?org=${organizationId}#note-95c0dd4a-85e4-4712-a47c-ce19c7b6118f`
		);
	});

	it('uses payload personId for WhatsApp links when personName is missing', () => {
		const context = buildContext([
			{
				id: 'whatsapp-1',
				type: 'whatsapp_message',
				referenceId: 'a03a1985-9c45-4fb7-ad1c-f6e25efafbb8',
				payload: {
					personId,
					personName: null
				}
			}
		]);

		expect(context.sections[0]?.items[0]?.url).toBe(
			`https://app.example.com/community/${personId}?org=${organizationId}`
		);
	});
});
