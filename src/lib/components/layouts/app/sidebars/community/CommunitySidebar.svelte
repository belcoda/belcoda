<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import ActionsMenu from '$lib/components/layouts/app/sidebars/community/ActionsMenu.svelte';
	import DesktopNavSidebar from '$lib/components/layouts/app/navigation/DesktopNavSidebar.svelte';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	const isMobile = new IsMobile();
	import Avatar from '$lib/components/widgets/avatar/Avatar.svelte';
	import { page } from '$app/state';
	import { type ReadPersonZero } from '$lib/schema/person';
	import { z } from '$lib/zero.svelte';
	import { listPersons } from '$lib/zero/query/person/list';
	import { formatShortTimestamp } from '$lib/utils/date';
	import ErrorAlert from '$lib/components/alerts/Error.svelte';
	import { appState, getListFilter } from '$lib/state.svelte';
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
				<div class="text-2xl font-bold text-foreground">Community</div>
				<ActionsMenu />
			</div>
			<PersonFilter bind:filter={personListFilter} />
		</Sidebar.Header>
		<Sidebar.Content>
			<Sidebar.Group class="p-0">
				<Sidebar.GroupContent class="p-0">
					{#if personList.details.type === 'error'}
						<div class="px-2"><ErrorAlert>Error loading persons</ErrorAlert></div>
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
					{person.emailAddress}
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
