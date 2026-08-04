<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import ActionsMenu from '$lib/components/layouts/app/sidebars/community/ActionsMenu.svelte';
	import DesktopNavSidebar from '$lib/components/layouts/app/navigation/DesktopNavSidebar.svelte';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	const isMobile = new IsMobile();
	import Avatar from '$lib/components/widgets/avatar/Avatar.svelte';
	import { page } from '$app/state';
	import { type ReadPersonZero } from '$lib/schema/person';
	import { type PersonAddedFrom } from '$lib/schema/person/meta';
	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';
	import { formatShortTimestamp } from '$lib/utils/date';
	import ErrorAlert from '$lib/components/alerts/Error.svelte';
	import { appState, getListFilter } from '$lib/state.svelte';
	import { type ActivityPreviewPayload } from '$lib/schema/activity/types';
	import { locale, t } from '$lib/index.svelte';
	import { formatNumber } from '$lib/utils/number';
	import { renderName } from '$lib/utils/name';
	import { renderWhatsAppMessagePreview } from '$lib/components/widgets/activity/preview/whatsapp_message';
	import { FavouriteFirstPaginatedZeroList } from '$lib/state/paginated-zero-list.svelte';
	import { encodePersonListCursor } from '$lib/utils/person/cursor';
	import EmailIcon from '@lucide/svelte/icons/mail';
	import StarIcon from '@lucide/svelte/icons/star';
	import { IsInViewport, watch } from 'runed';
	import PersonFilter from '$lib/components/widgets/person/filter/Filter.svelte';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import { toast } from 'svelte-sonner';

	type SidebarPerson = ReadPersonZero & {
		readonly favourites: readonly { readonly id: string }[];
	};

	let personListFilter = $state({
		...getListFilter(appState.organizationId),
		tagId: null,
		signupEventId: null,
		mostRecentActivity: null
	});
	const pageSize = 25;
	let sentinel: HTMLElement | null = $state(null);
	const sentinelIsInViewport = $derived(new IsInViewport(() => sentinel));
	const paginatedPersonList = new FavouriteFirstPaginatedZeroList({
		getBaseFilter: () => personListFilter,
		getPrioritizeFavourites: () => appState.prioritizePeopleFavourites,
		encodeCursor: encodePersonCursor,
		pageSize
	});
	const favouritePersonList = $derived.by(() => {
		const filter = paginatedPersonList.favouritePageFilter;
		return filter ? z.createQuery(queries.person.list(filter)) : null;
	});
	const remainingPersonList = $derived.by(() => {
		const filter = paginatedPersonList.remainingPageFilter;
		return filter ? z.createQuery(queries.person.list(filter)) : null;
	});
	const personListFailed = $derived(
		favouritePersonList?.details.type === 'error' || remainingPersonList?.details.type === 'error'
	);
	const unreadWhatsappMessageCountsByPersonId = $derived(
		appState.unreadWhatsappMessageCountsByPersonId
	);
	let preferenceRequest = 0;

	watch(
		() => favouritePersonList?.data,
		(data) => {
			paginatedPersonList.handleFavouritePage(data);
		}
	);
	watch(
		() => remainingPersonList?.data,
		(data) => {
			paginatedPersonList.handleRemainingPage(data);
		}
	);
	watch(
		() =>
			[
				sentinelIsInViewport.current,
				paginatedPersonList.hasMore,
				paginatedPersonList.items.length
			] as const,
		([isInViewport, hasMore]) => {
			if (isInViewport && hasMore) {
				paginatedPersonList.loadMore();
			}
		}
	);

	function encodePersonCursor(person: SidebarPerson) {
		return encodePersonListCursor({
			id: person.id,
			mostRecentActivityAt: person.mostRecentActivityAt
		});
	}

	async function updatePrioritizeFavourites(prioritizeFavourites: boolean) {
		const previousValue = appState.prioritizePeopleFavourites;
		const organizationId = appState.organizationId;
		const request = ++preferenceRequest;
		appState.prioritizePeopleFavourites = prioritizeFavourites;

		try {
			const result = z.mutate(
				mutators.memberSettings.updatePeopleSidebar({
					metadata: { organizationId },
					input: { prioritizePeopleFavourites: prioritizeFavourites }
				})
			);
			await result.client;
			const serverResult = await result.server;
			if (serverResult.type === 'error') {
				throw new Error(serverResult.error.message);
			}
		} catch {
			if (request === preferenceRequest && organizationId === appState.organizationId) {
				appState.prioritizePeopleFavourites = previousValue;
				toast.error(t`Could not save the favourite ordering preference. Please try again.`);
			}
		}
	}
</script>

<Sidebar.Root
	collapsible={!isMobile.current ? 'icon' : 'none'}
	class="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
>
	{#if !isMobile.current}
		<DesktopNavSidebar />
	{/if}
	<Sidebar.Root collapsible="none" class="flex w-full min-w-0 flex-1">
		<Sidebar.Header class="gap-3.5 border-b p-4">
			<div class="flex w-full items-center justify-between">
				<div class="text-2xl font-bold text-foreground">{t`Community`}</div>
				<ActionsMenu />
			</div>
			<div class="flex items-center justify-between gap-3 text-sm">
				<label for="prioritize-people-favourites" class="flex items-center gap-2">
					<StarIcon class="size-4 text-amber-500" fill="currentColor" />
					<span>{t`Prioritize favourites`}</span>
				</label>
				<Switch
					id="prioritize-people-favourites"
					checked={appState.prioritizePeopleFavourites}
					onCheckedChange={updatePrioritizeFavourites}
					aria-label={t`Prioritize favourites`}
					data-testid="prioritize-people-favourites-toggle"
				/>
			</div>
			<PersonFilter bind:filter={personListFilter} />
		</Sidebar.Header>
		<Sidebar.Content>
			<Sidebar.Group class="p-0">
				<Sidebar.GroupContent class="p-0">
					{#if personListFailed}
						<div class="px-2"><ErrorAlert>{t`Error loading persons`}</ErrorAlert></div>
					{/if}
					{#each paginatedPersonList.items as person (person.id)}
						{@render personItem(person)}
					{/each}
				</Sidebar.GroupContent>
			</Sidebar.Group>
			{#if paginatedPersonList.items.length > 0}
				<div class="border-t p-2">
					<div class="mb-2 text-center text-xs text-muted-foreground">
						{t`${formatNumber(paginatedPersonList.items.length, locale.current)} shown`}
					</div>
					{#if paginatedPersonList.hasMore}
						<div bind:this={sentinel} class="h-1" data-testid="community-scroll-sentinel"></div>
					{/if}
				</div>
			{/if}
		</Sidebar.Content>
	</Sidebar.Root>
</Sidebar.Root>

{#snippet personItem(person: SidebarPerson)}
	{@const unreadMessageCount = unreadWhatsappMessageCountsByPersonId.get(person.id) ?? 0}
	{@const isFavourite = person.favourites.length > 0}
	{@const unreadMessageCountDisplay =
		unreadMessageCount > 99 ? '99+' : formatNumber(unreadMessageCount, locale.current)}
	<a
		data-testid="community-person-list-link"
		data-person-id={person.id}
		data-favourite={isFavourite}
		href={`/community/${person.id}`}
		class:bg-sidebar-accent={page.url.pathname.startsWith(`/community/${person.id}`)}
		class:text-sidebar-accent-foreground={page.url.pathname.startsWith(`/community/${person.id}`)}
		class="flex w-full items-center justify-between gap-2 border-b px-3 py-3 last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
	>
		<div class="flex min-w-0 flex-1 items-center gap-2">
			<div>
				<Avatar
					class="aspect-square size-11 shrink-0"
					name1={person.givenName || person.familyName || person.emailAddress || ''}
					name2={!person.givenName && person.familyName ? undefined : person.familyName}
					src={person.profilePicture}
				/>
			</div>
			<div class="min-w-0 flex-1">
				<div class="flex items-center gap-1 text-sm font-medium">
					<span class="truncate">
						{renderName({
							givenName: person.givenName,
							familyName: person.familyName,
							country: person.country
						})}
					</span>
					{#if isFavourite}
						<StarIcon
							class="size-3.5 shrink-0 text-amber-500"
							fill="currentColor"
							aria-hidden="true"
							data-testid="community-person-favourite-indicator"
						/>
						<span class="sr-only">{t`Favourite`}</span>
					{/if}
					{#if unreadMessageCount > 0}
						<span
							class="flex h-5 w-7 shrink-0 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-none font-semibold text-primary-foreground"
							title={t`Unread WhatsApp`}
						>
							<span aria-hidden="true">{unreadMessageCountDisplay}</span>
							<span class="sr-only">
								{t`${formatNumber(unreadMessageCount, locale.current)} unread WhatsApp messages`}
							</span>
						</span>
					{/if}
				</div>
				<div class="truncate text-xs text-muted-foreground">
					{@render renderActivityPreview(person.mostRecentActivityPreview, person.addedFrom)}
				</div>
			</div>
		</div>
		<div class="shrink-0">
			<div class="text-xs whitespace-nowrap text-muted-foreground">
				{formatShortTimestamp(person.mostRecentActivityAt)}
			</div>
		</div>
	</a>
{/snippet}

{#snippet renderActivityPreview(
	activityPreview: ActivityPreviewPayload | null,
	addedFrom: PersonAddedFrom
)}
	{#if activityPreview}
		{#if activityPreview.type === 'tag_added'}
			<div>
				{t`Added to ${activityPreview.tagName}`}
			</div>
		{:else if activityPreview.type === 'tag_removed'}
			<div>
				{t`Removed from ${activityPreview.tagName}`}
			</div>
		{:else if activityPreview.type === 'team_added'}
			<div>
				{t`Added to ${activityPreview.teamName}`}
			</div>
		{:else if activityPreview.type === 'team_removed'}
			<div>
				{t`Removed from ${activityPreview.teamName}`}
			</div>
		{:else if activityPreview.type === 'event_signup'}
			<div>
				{t`Signed up for ${activityPreview.eventName}`}
			</div>
		{:else if activityPreview.type === 'event_signup_email_sent'}
			<div>
				{t`Email sent for ${activityPreview.eventName}`}
			</div>
		{:else if activityPreview.type === 'event_reminder_email_sent'}
			<div>
				{t`Reminder email sent for ${activityPreview.eventName}`}
			</div>
		{:else if activityPreview.type === 'event_attended'}
			<div>
				{t`Attended ${activityPreview.eventName}`}
			</div>
		{:else if activityPreview.type === 'event_noshow'}
			<div>
				{t`No show for ${activityPreview.eventName}`}
			</div>
		{:else if activityPreview.type === 'event_apology'}
			<div>
				{t`Apology for ${activityPreview.eventName}`}
			</div>
		{:else if activityPreview.type === 'event_removed'}
			<div>
				{t`Removed from ${activityPreview.eventName}`}
			</div>
		{:else if activityPreview.type === 'petition_signed'}
			<div>
				{t`Signed petition ${activityPreview.petitionName}`}
			</div>
		{:else if activityPreview.type === 'petition_removed'}
			<div>
				{t`Removed petition ${activityPreview.petitionName}`}
			</div>
		{:else if activityPreview.type === 'note_added'}
			<div>
				{t`${activityPreview.userName} added note: `}
				<span class="italic">{activityPreview.notePreview}</span>
			</div>
		{:else if activityPreview.type === 'whatsapp_message_incoming'}
			<div>
				{renderWhatsAppMessagePreview(activityPreview.message)}
			</div>
		{:else if activityPreview.type === 'whatsapp_message_outgoing'}
			<div>
				{renderWhatsAppMessagePreview(activityPreview.message)}
			</div>
		{:else if activityPreview.type === 'email_outgoing'}
			<div class="flex min-w-0 items-center gap-1">
				<EmailIcon size={14} class="shrink-0" />
				<div class="min-w-0 shrink truncate">{activityPreview.subject}</div>
				<div class="min-w-0 flex-1 truncate">{activityPreview.bodyStart}</div>
			</div>
		{:else}
			{t`Unknown activity ${activityPreview.type}`}
		{/if}
	{:else}
		<!-- No ativity preview... Let's just say when the person was added-->
		{#if addedFrom.type === 'seeds'}
			<div class="italic">{t`Added from seed data (should only appear in dev)`}</div>
		{:else if addedFrom.type === 'migration'}
			<div class="italic">{t`Data migration`}</div>
		{:else if addedFrom.type === 'import'}
			<div class="italic">{t`Imported from CSV`}</div>
		{:else if addedFrom.type === 'added_manually'}
			<div class="italic">{t`Added to the organization`}</div>
		{:else if addedFrom.type === 'added_from_event'}
			<div class="italic">{t`Joined through an event`}</div>
		{:else if addedFrom.type === 'added_from_petition'}
			<div class="italic">{t`Signed a petition`}</div>
		{:else}
			<div class="italic">{t`Added from an unknown source [${JSON.stringify(addedFrom)}]`}</div>
		{/if}
	{/if}
{/snippet}
