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
	import { listPersons } from '$lib/zero/query/person/list';
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
	const personList = $derived.by(() =>
		z.createQuery(listPersons(appState.queryContext, personListFilter))
	);
	import PersonFilter from '$lib/components/widgets/person/filter/Filter.svelte';
</script>

<Sidebar.Root
	collapsible={!isMobile.current ? 'icon' : 'none'}
	class="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
>
	{#if !isMobile.current}
		<DesktopNavSidebar />
	{/if}
	<Sidebar.Root collapsible="none" class="flex w-full flex-1">
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
		<div class="flex items-center gap-2">
			<div>
				<Avatar
					class="aspect-square size-11 shrink-0"
					name1={person.givenName || person.familyName || person.emailAddress || ''}
					name2={!person.givenName && person.familyName ? undefined : person.familyName}
					src={person.profilePicture}
				/>
			</div>
			<div>
				<div class="text-sm font-medium">
					{person.givenName}
					{person.familyName}
				</div>
				<div class="line-clamp-1 text-xs text-muted-foreground">
					{@render renderActivityPreview(person.mostRecentActivityPreview, person.addedFrom)}
				</div>
			</div>
		</div>
		<div>
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
				{`Added to ${activityPreview.tagName}`}
			</div>
		{:else if activityPreview.type === 'tag_removed'}
			<div>
				{`Removed from ${activityPreview.tagName}`}
			</div>
		{:else if activityPreview.type === 'team_added'}
			<div>
				{`Added to ${activityPreview.teamName}`}
			</div>
		{:else if activityPreview.type === 'team_removed'}
			<div>
				{`Removed from ${activityPreview.teamName}`}
			</div>
		{:else if activityPreview.type === 'event_signup'}
			<div>
				{`Signed up for ${activityPreview.eventName}`}
			</div>
		{:else if activityPreview.type === 'event_signup_email_sent'}
			<div>
				{`Email sent for ${activityPreview.eventName}`}
			</div>
		{:else if activityPreview.type === 'event_reminder_email_sent'}
			<div>
				{`Reminder email sent for ${activityPreview.eventName}`}
			</div>
		{:else if activityPreview.type === 'event_attended'}
			<div>
				{`Attended ${activityPreview.eventName}`}
			</div>
		{:else if activityPreview.type === 'event_noshow'}
			<div>
				{`No show for ${activityPreview.eventName}`}
			</div>
		{:else if activityPreview.type === 'event_apology'}
			<div>
				{`Apology for ${activityPreview.eventName}`}
			</div>
		{:else if activityPreview.type === 'event_removed'}
			<div>
				{`Removed from ${activityPreview.eventName}`}
			</div>
		{:else if activityPreview.type === 'petition_signed'}
			<div>
				{`Signed petition ${activityPreview.petitionName}`}
			</div>
		{:else if activityPreview.type === 'petition_removed'}
			<div>
				{`Removed petition ${activityPreview.petitionName}`}
			</div>
		{:else if activityPreview.type === 'note_added'}
			<div>
				<span class="font-medium">{activityPreview.userName}</span> added note:
				<span class="italic">{activityPreview.notePreview}</span>
			</div>
		{:else}
			{`Unknown activity ${activityPreview.type}`}
		{/if}
	{:else}
		<!-- No ativity preview... Let's just say when the person was added-->
		{#if addedFrom.type === 'seeds'}
			<div class="italic">Added from seed data (should only appear in dev)</div>
		{:else if addedFrom.type === 'import'}
			<div class="italic">Imported from CSV</div>
		{:else if addedFrom.type === 'added_manually'}
			<div class="italic">Added to the organization</div>
		{:else if addedFrom.type === 'added_from_event'}
			<div class="italic">Joined through an event</div>
		{:else if addedFrom.type === 'added_from_petition'}
			<div class="italic">Signed a petition</div>
		{:else}
			<div class="italic">Added from an unknown source [{JSON.stringify(addedFrom)}]</div>
		{/if}
	{/if}
{/snippet}
