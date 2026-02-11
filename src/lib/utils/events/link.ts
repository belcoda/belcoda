import { dev } from '$app/environment';
import { env } from '$env/dynamic/public';
import { type ReadEventZero } from '$lib/schema/event';
import { type ReadActionCodeZero } from '$lib/schema/action-code';
import { appState } from '$lib/state.svelte';
import { type ReadOrganizationZero } from '$lib/schema/organization';

export function getEventLink({
	eventSlug,
	organizationSlug
}: {
	eventSlug: string;
	organizationSlug: string;
}) {
	return `http${dev ? '' : 's'}://${organizationSlug}.${env.PUBLIC_ROOT_DOMAIN}/events/${eventSlug}`;
}

export function generateWhatsAppSignupLink({
	eventTitle,
	whatsAppNumber,
	actionCode
}: {
	eventTitle: string;
	whatsAppNumber?: string | null;
	actionCode: string;
}) {
	return `https://wa.me/${whatsAppNumber || env.PUBLIC_DEFAULT_WHATSAPP_NUMBER}/?text=${encodeURIComponent(`Send to check in to ${eventTitle} [#${actionCode}] (do not edit this message)`)}`;
}
