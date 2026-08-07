<script lang="ts">
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import { afterNavigate } from '$app/navigation';
	import UserRoundIcon from '@lucide/svelte/icons/user-round';
	import { z } from '$lib/zero.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import { t } from '$lib/index.svelte';
	import queries from '$lib/zero/query/index';
	const { params } = $props();
	const person = $derived.by(() => {
		return z.createQuery(queries.person.read({ personId: params.personId }));
	});
	import RenderPerson from '$lib/components/widgets/render/RenderPerson.svelte';
	import NotesAction from '$lib/components/layouts/app/action-menus/person/NotesAction.svelte';
	import PersonContextPanel from '$lib/components/widgets/person/context/PersonContextPanel.svelte';
	import PersonContextDetails from '$lib/components/widgets/person/context/PersonContextDetails.svelte';
	import type { PersonContextPanelState } from '$lib/components/widgets/person/context/person-context-panel';
	import type { ReadPersonOutputWithReadonlyArrays } from '$lib/zero/query/person/read';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import ActivityTimeline from '$lib/components/widgets/activity/ActivityTimeline.svelte';
	import FavouriteButton from '$lib/components/widgets/favourite/FavouriteButton.svelte';
	import ConversationComposer from '$lib/components/widgets/notes/ConversationComposer.svelte';
	import { renderName } from '$lib/utils/name';
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

	const personDisplayName = $derived.by(() => {
		if (!person.data?.givenName && !person.data?.familyName) return undefined;
		return renderName({
			givenName: person.data.givenName,
			familyName: person.data.familyName,
			country: person.data.country
		});
	});

	let personContextCollapsed = $state(false);
	let personContextDrawerOpen = $state(false);
	const personContextState: PersonContextPanelState = $derived.by(() => {
		if (person.details.type === 'unknown') {
			return { status: 'loading' };
		}
		if (person.details.type === 'error') {
			return { status: 'error' };
		}
		if (!person.data) {
			return { status: 'not-found' };
		}
		return { status: 'ready', person: person.data };
	});

	function markPersonWhatsappNotificationsAsRead() {
		void z
			.mutate(
				mutators.notification.markPersonWhatsappAsRead({
					metadata: { organizationId: appState.organizationId, personId: params.personId }
				})
			)
			.server.catch(() => {});
	}

	afterNavigate(() => {
		markPersonWhatsappNotificationsAsRead();
	});

	//TODO: Once we implement the account selector tabs, only render the ConversationComposer when appState.activeWhatsappAccountId is set.
</script>

<ContentLayout rootLink="/community" {header} bodyPadding="p-0 gap-y-0" scrollBody={false}>
	<div class="flex min-h-0 flex-1">
		<div class="flex min-w-0 flex-1 flex-col">
			<ActivityTimeline personId={params.personId} />
			<ConversationComposer
				personId={params.personId}
				{personDisplayName}
				whatsappConfigured={Boolean(whatsappOnboarded)}
				whatsappWindowOpen={isLastReceivedAtLessThan24HoursAgo}
			/>
		</div>

		<div
			class="hidden h-full shrink-0 transition-[width] xl:flex"
			class:w-14={personContextCollapsed}
			class:w-80={!personContextCollapsed}
		>
			<PersonContextPanel
				personId={params.personId}
				state={personContextState}
				collapsible
				collapsed={personContextCollapsed}
				onCollapsedChange={(collapsed) => (personContextCollapsed = collapsed)}
				content={personContextContent}
			/>
		</div>
	</div>
</ContentLayout>

{#snippet header()}
	<div class="flex items-center justify-between">
		<a href={`/community/${params.personId}/profile`}
			><RenderPerson
				person={person.data}
				personId={params.personId}
				loadPerson={false}
				textClass="text-lg font-medium"
				testId="person-timeline-display-name"
			/></a
		>
		<div class="flex items-center gap-2">
			<Sheet.Root bind:open={personContextDrawerOpen}>
				<Sheet.Trigger>
					{#snippet child({ props })}
						<Button
							{...props}
							variant="ghost"
							size="icon"
							class="xl:hidden"
							aria-label={t`Show person profile`}
							title={t`Show person profile`}
							data-testid="person-context-drawer-trigger"
						>
							<UserRoundIcon />
						</Button>
					{/snippet}
				</Sheet.Trigger>
				<Sheet.Content
					side="right"
					class="w-full gap-0 p-0 [&>button:last-child]:hidden sm:max-w-sm"
				>
					<Sheet.Title class="sr-only">{t`Person profile`}</Sheet.Title>
					<Sheet.Description class="sr-only">
						{t`Profile information for the current conversation`}
					</Sheet.Description>
					<PersonContextPanel
						personId={params.personId}
						state={personContextState}
						onClose={() => (personContextDrawerOpen = false)}
						content={personContextContent}
					/>
				</Sheet.Content>
			</Sheet.Root>

			{#if person.data}
				<FavouriteButton referenceType="person" referenceId={person.data.id} />
				<NotesAction person={person.data} currentPage="timeline" />
			{:else}
				<Skeleton class="h-10 w-20 rounded-lg" />
			{/if}
		</div>
	</div>
{/snippet}

{#snippet personContextContent(person: ReadPersonOutputWithReadonlyArrays)}
	<PersonContextDetails
		{person}
		whatsappConfigured={Boolean(whatsappOnboarded)}
		whatsappWindowOpen={isLastReceivedAtLessThan24HoursAgo}
	/>
{/snippet}
