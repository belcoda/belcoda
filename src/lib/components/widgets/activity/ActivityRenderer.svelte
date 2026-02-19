<script lang="ts">
	import type { ReadActivityZero } from '$lib/schema/activity';

	import EventSignup from './EventSignup.svelte';
	import TagAdded from './TagAdded.svelte';
	import TagRemoved from './TagRemoved.svelte';
	import TeamAdded from './TeamAdded.svelte';
	import TeamRemoved from './TeamRemoved.svelte';
	import OutgoingEmail from './OutgoingEmail.svelte';

	type Props = {
		activity: ReadActivityZero;
	};

	const { activity }: Props = $props();
</script>

{#if activity.type === 'event_signup'}
	<EventSignup {activity} />
{/if}

{#if activity.type === 'tag_added'}
	<TagAdded {activity} />
{/if}

{#if activity.type === 'tag_removed'}
	<TagRemoved {activity} />
{/if}

{#if activity.type === 'team_added'}
	<TeamAdded {activity} />
{/if}

{#if activity.type === 'team_removed'}
	<TeamRemoved {activity} />
{/if}

{#if activity.type === 'email_outgoing'}
	<OutgoingEmail {activity} />
{/if}
