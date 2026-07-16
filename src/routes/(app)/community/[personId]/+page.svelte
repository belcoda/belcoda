<script lang="ts">
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import { z } from '$lib/zero.svelte';
	import { t } from '$lib/index.svelte';
	import queries from '$lib/zero/query/index';
	const { params } = $props();
	const person = $derived.by(() => {
		return z.createQuery(queries.person.read({ personId: params.personId }));
	});
	import RenderPerson from '$lib/components/widgets/render/RenderPerson.svelte';
	import NotesAction from '$lib/components/layouts/app/action-menus/person/NotesAction.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import ActivityTimeline from '$lib/components/widgets/activity/ActivityTimeline.svelte';
	import SendBusinessApiIndividualMessage from '$lib/components/widgets/communications/send_wa_msg/SendBusinessApiIndividualMessage.svelte';
	import SendBusinessApiTemplateMessage from '$lib/components/widgets/communications/send_wa_msg/BusinessApiTemplateMessageFrame.svelte';
	const lastReceivedAt = $derived(person.data?.mostRecentWhatsappMessageReceivedAt || 0);
	const lastReceivedAtDate = $derived(new Date((() => lastReceivedAt)()));
	const isLastReceivedAtLessThan24HoursAgo = $derived(
		lastReceivedAtDate > new Date(Date.now() - 24 * 60 * 60 * 1000)
	);
	import { appState } from '$lib/state.svelte';
	const whatsappOnboarded = $derived(
		appState.activeOrganization?.data?.settings.whatsApp.wabaId &&
			appState.activeOrganization?.data?.settings.whatsApp.number
	);
</script>

<ContentLayout
	rootLink="/community"
	{header}
	footer={appState.activeWhatsappAccountId ? footer : undefined}
	bodyPadding="p-0 gap-y-0"
	scrollBody={false}
	hideFooter={!whatsappOnboarded}
>
	<ActivityTimeline personId={params.personId} />
</ContentLayout>

{#snippet footer()}
	{#if appState.activeWhatsappAccountId}
		{#if whatsappOnboarded}
			{#if isLastReceivedAtLessThan24HoursAgo}
				<SendBusinessApiIndividualMessage personId={params.personId} />
			{:else}
				<SendBusinessApiTemplateMessage personId={params.personId} />
			{/if}
		{:else}
			<div class="flex items-center justify-center">
				<p class="text-sm text-muted-foreground">
					{t`WhatsApp is not onboarded for this organization. Please contact support to onboard.`}
				</p>
			</div>
		{/if}
	{/if}
{/snippet}

{#snippet header()}
	<div class="flex items-center justify-between">
		<a href={`/community/${params.personId}/profile`}
			><RenderPerson
				person={person.data}
				personId={params.personId}
				textClass="text-lg font-medium"
				testId="person-timeline-display-name"
			/></a
		>
		{#if person.data}
			<NotesAction person={person.data} currentPage="timeline" />
		{:else}
			<Skeleton class="h-10 w-20 rounded-lg" />
		{/if}
	</div>
{/snippet}
