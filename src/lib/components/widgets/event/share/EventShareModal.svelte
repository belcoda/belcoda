<script lang="ts">
	const { eventId }: { eventId: string } = $props();
	import { z } from '$lib/zero.svelte';
	import { getAppState } from '$lib/state.svelte';
	const appState = getAppState();
	import { listActionCodes } from '$lib/zero/query/action_code/list';
	import { readEvent } from '$lib/zero/query/event/read';
	import { t } from '$lib/index.svelte';
	const actionCodes = $derived.by(() => {
		return z.createQuery(
			listActionCodes(appState.queryContext, {
				organizationId: appState.organizationId,
				referenceId: eventId
			})
		);
	});
	const event = $derived.by(() => {
		return z.createQuery(
			readEvent(appState.queryContext, {
				eventId: eventId
			})
		);
	});
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	const actionCodeSignup = $derived.by(() => {
		return actionCodes.data?.find((actionCode) => actionCode.type === 'event_signup');
	});
	const actionCodeAttended = $derived.by(() => {
		return actionCodes.data?.find((actionCode) => actionCode.type === 'event_attended');
	});

	import EmbedCode from './EmbedCode.svelte';
	import CheckIn from './CheckIn.svelte';
	import ShareEvent from './ShareEvent.svelte';
</script>

<Tabs.Root value="share">
	<Tabs.List>
		<Tabs.Trigger value="share">{t`Share`}</Tabs.Trigger>
		<Tabs.Trigger value="embed">{t`Embed`}</Tabs.Trigger>
		<Tabs.Trigger value="checkin">{t`Check-in`}</Tabs.Trigger>
	</Tabs.List>
	<Tabs.Content value="share">
		{#if event.data && actionCodeSignup}
			<ShareEvent event={event.data} actionCode={actionCodeSignup} />
		{/if}
	</Tabs.Content>
	<Tabs.Content value="embed">
		{#if event.data}
			<EmbedCode event={event.data} />
		{/if}
	</Tabs.Content>
	<Tabs.Content value="checkin">
		{#if event.data && actionCodeAttended}
			<CheckIn event={event.data} actionCode={actionCodeAttended} />
		{/if}
	</Tabs.Content>
</Tabs.Root>
