import { describe, expect, it } from 'vitest';
import { runWithLocale, loadLocales } from 'wuchale/load-utils/server';
import * as js from '$lib/../locales/js.loader.server.js';
import { locales } from '$lib/../locales/data.js';
import { buildDigestContext } from './digest_context';

type NotificationInput = Parameters<typeof buildDigestContext>[0]['notifications'][number];

// Register the js-adapter catalogs (as hooks.server.ts does) so the `t` macros
// inside buildDigestContext resolve when we run inside a locale.
await loadLocales(js.key, js.loadCount, js.loadCatalog, locales);

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

function whatsappMessages(count: number): NotificationInput[] {
	return Array.from({ length: count }, (_, i) => ({
		id: `wa-${i}`,
		type: 'whatsapp_message',
		referenceId: 'thread-1',
		payload: { personId, personName: 'Jordan Rivera' }
	}));
}

function eventSignups(names: string[]): NotificationInput[] {
	return names.map((personName, i) => ({
		id: `ev-${i}`,
		type: 'event_signup',
		referenceId: 'event-1',
		payload: { subjectTitle: 'Canvassing day', personName, personId: `person-${i}` }
	}));
}

function petitionSignatures(names: string[]): NotificationInput[] {
	return names.map((personName, i) => ({
		id: `petition-${i}`,
		type: 'petition_signup',
		referenceId: 'petition-1',
		payload: { subjectTitle: 'Safer streets', personName, personId: `person-${i}` }
	}));
}

describe('buildDigestContext', () => {
	it('links a note mention to its person when the person has no display name', () => {
		const noteId = '95c0dd4a-85e4-4712-a47c-ce19c7b6118f';
		const context = buildContext([
			{
				id: 'note-mention-1',
				type: 'person_note_mention',
				referenceId: noteId,
				payload: {
					personId,
					personName: null,
					noteAuthorName: 'A teammate',
					notePreview: 'You were mentioned.'
				}
			}
		]);

		expect(context.sections[0]?.items[0]?.url).toBe(
			`https://app.example.com/community/${personId}?org=${organizationId}#note-${noteId}`
		);
	});

	it('groups messages per contact and selects the singular message label', async () => {
		const context = await runWithLocale('en', async () => buildContext(whatsappMessages(1)));
		const section = context.sections[0];
		expect(section?.label).toBe('WhatsApp messages');
		expect(section?.items).toHaveLength(1);
		expect(section?.items[0]?.detail).toBe('1 new message');
	});

	it('selects the plural message label when a contact sent several messages', async () => {
		const context = await runWithLocale('en', async () => buildContext(whatsappMessages(3)));
		expect(context.sections[0]?.items[0]?.detail).toBe('3 new messages');
		expect(context.totalCount).toBe(3);
	});

	it('summarizes event sign-ups with "and N others" once past two people', async () => {
		const two = await runWithLocale('en', async () =>
			buildContext(eventSignups(['Alex Chen', 'Bianca Rossi']))
		);
		expect(two.sections[0]?.items[0]?.detail).toBe('Alex Chen and Bianca Rossi have signed up');

		const four = await runWithLocale('en', async () =>
			buildContext(eventSignups(['Alex Chen', 'Bianca Rossi', 'Cai Wu', 'Dev Patel']))
		);
		expect(four.sections[0]?.items[0]?.detail).toBe(
			'Alex Chen, Bianca Rossi, and 2 others have signed up'
		);
	});

	it('localizes section labels and details for the recipient locale', async () => {
		const context = await runWithLocale('fr', async () => buildContext(whatsappMessages(2)));
		expect(context.sections[0]?.label).toBe('Messages WhatsApp');
		expect(context.sections[0]?.items[0]?.detail).toBe('2 nouveaux messages');
	});

	it.each([
		['es', 'Alex Chen y Bianca Rossi se inscribieron', 'Alex Chen y Bianca Rossi firmaron'],
		['fr', 'Alex Chen et Bianca Rossi se sont inscrit(e)s', 'Alex Chen et Bianca Rossi ont signé'],
		['pt', 'Alex Chen e Bianca Rossi inscreveram-se', 'Alex Chen e Bianca Rossi assinaram'],
		['sw', 'Alex Chen na Bianca Rossi wamejisajili', 'Alex Chen na Bianca Rossi wametia saini']
	])('uses plural agreement for grouped people in %s', async (locale, signup, signature) => {
		const eventContext = await runWithLocale(locale, async () =>
			buildContext(eventSignups(['Alex Chen', 'Bianca Rossi']))
		);
		expect(eventContext.sections[0]?.items[0]?.detail).toBe(signup);

		const petitionContext = await runWithLocale(locale, async () =>
			buildContext(petitionSignatures(['Alex Chen', 'Bianca Rossi']))
		);
		expect(petitionContext.sections[0]?.items[0]?.detail).toBe(signature);
	});
});
