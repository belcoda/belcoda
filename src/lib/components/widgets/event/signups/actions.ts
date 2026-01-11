import { z } from '$lib/zero.svelte';
import { formatShortTimestamp } from '$lib/utils/date';
import { getLocalTimeZone } from '@internationalized/date';
import { appState } from '$lib/state.svelte';
import { locale } from '$lib/index.svelte';
import { type ReadEventSignupZeroWithPerson } from '$lib/schema/event-signup';
import { type ReadEventZero } from '$lib/schema/event';

import { v7 as uuidv7 } from 'uuid';

export function handleUpdateStatus({
	eventSignupId,
	organizationId,
	personId,
	eventId,
	status
}: {
	eventSignupId: string;
	organizationId: string;
	personId: string;
	eventId: string;
	status: 'attended' | 'noshow' | 'notattending' | 'signup';
}) {
	z.mutate.eventSignup.update({
		input: {
			status
		},
		metadata: {
			eventSignupId,
			organizationId,
			eventId,
			personId
		}
	});
}

export function handleAddPerson({ eventId, personIds }: { eventId: string; personIds: string[] }) {
	personIds.forEach((personId) => {
		z.mutate.eventSignup.create({
			input: {
				eventId: eventId,
				personId,
				details: {
					channel: {
						type: 'adminPanel'
					},
					customFields: {}
				},
				status: 'signup'
			},
			metadata: {
				eventSignupId: uuidv7(),
				organizationId: appState.organizationId,
				eventId: eventId,
				personId
			}
		});
	});
}

export function renderSignupChannel({
	channel,
	event,
	date
}: {
	channel: ReadEventSignupZeroWithPerson['details']['channel'];
	event: ReadEventZero;
	date: number;
}) {
	const formattedDate = formatShortTimestamp(date, locale.current, getLocalTimeZone());
	switch (channel.type) {
		case 'eventPage':
			return `Signed up via event page [${formattedDate}]`;
		case 'adminPanel':
			return `Added manually [${formattedDate}]`;
		case 'whatsapp':
			return `Signed up via WhatsApp [${formattedDate}]`;
	}
}
