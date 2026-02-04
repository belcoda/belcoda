import { dev } from '$app/environment';
import { env } from '$env/dynamic/public';
import { type ReadEventZero } from '$lib/schema/event';
import { type ReadActionCodeZero } from '$lib/schema/action-code';
import { appState } from '$lib/state.svelte';

export function getEventLink({
	eventSlug,
	organizationSlug
}: {
	eventSlug: string;
	organizationSlug: string;
}) {
	return `http${dev ? '' : 's'}://${organizationSlug}.${env.PUBLIC_ROOT_DOMAIN}/events/${eventSlug}`;
}

export function generateWhatsAppSignupLink(eventTitle: string, actionCode: string) {
	return `https://wa.me/${appState.activeOrganization.data?.settings.whatsApp.number || env.PUBLIC_DEFAULT_WHATSAPP_NUMBER}/?text=${encodeURIComponent(`Send to check in to ${eventTitle} [#${actionCode}] (do not edit this message)`)}`;
}
