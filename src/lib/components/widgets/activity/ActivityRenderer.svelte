<script lang="ts">
	import type { ReadActivityZero } from '$lib/schema/activity';

	import EventSignup from './EventSignup.svelte';
	import EventNoShow from './EventNoShow.svelte';
	import TagAdded from './TagAdded.svelte';
	import TagRemoved from './TagRemoved.svelte';
	import TeamAdded from './TeamAdded.svelte';
	import TeamRemoved from './TeamRemoved.svelte';
	import OutgoingEmail from './OutgoingEmail.svelte';
	import PetitionSigned from './PetitionSigned.svelte';
	import IncomingWhatsAppMessage from './IncomingWhatsAppMessage.svelte';
	import OutgoingWhatsAppMessage from './OutgoingWhatsAppMessage.svelte';

	import { dev } from '$app/environment';

	type Props = {
		activity: ReadActivityZero;
	};

	const { activity }: Props = $props();
</script>

{#if activity.type === 'event_signup'}
	<EventSignup {activity} />
{:else if activity.type === 'event_attended' || activity.type === 'event_noshow' || activity.type === 'event_not_attending' || activity.type === 'event_apology' || activity.type === 'event_removed'}
	<EventNoShow {activity} />
{:else if activity.type === 'tag_added'}
	<TagAdded {activity} />
{:else if activity.type === 'tag_removed'}
	<TagRemoved {activity} />
{:else if activity.type === 'team_added'}
	<TeamAdded {activity} />
{:else if activity.type === 'team_removed'}
	<TeamRemoved {activity} />
{:else if activity.type === 'email_outgoing'}
	<OutgoingEmail {activity} />
{:else if activity.type === 'petition_signed' || activity.type === 'petition_removed'}
	<PetitionSigned {activity} />
{:else if activity.type === 'whatsapp_message_incoming'}
	<IncomingWhatsAppMessage {activity} />
{:else if activity.type === 'whatsapp_message_outgoing'}
	<OutgoingWhatsAppMessage {activity} />
{:else if dev}
	<div class="text-xs text-orange-500">Unhandled activity type: {activity.type}</div>
{/if}
