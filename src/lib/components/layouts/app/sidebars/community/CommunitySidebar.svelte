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
	import { t } from '$lib/index.svelte';
	let personListFilter = $state({
		...getListFilter(appState.organizationId),
		tagId: null,
		signupEventId: null,
		mostRecentActivity: null
	});
	const personList = $derived.by(() => z.createQuery(queries.person.list(personListFilter)));
	import PersonFilter from '$lib/components/widgets/person/filter/Filter.svelte';
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
			<PersonFilter bind:filter={personListFilter} />
		</Sidebar.Header>
		<Sidebar.Content>
			<Sidebar.Group class="p-0">
				<Sidebar.GroupContent class="p-0">
					{#if personList.details.type === 'error'}
						<div class="px-2"><ErrorAlert>{t`Error loading persons`}</ErrorAlert></div>
					{/if}
					{#each personList.data as person (person.id)}
						{@render personItem(person)}
					{/each}
				</Sidebar.GroupContent>
			</Sidebar.Group>
		</Sidebar.Content>
	</Sidebar.Root>
</Sidebar.Root>

{#snippet personItem(person: ReadPersonZero)}
	<a
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
				<div class="truncate text-sm font-medium">
					{person.givenName}
					{person.familyName}
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
