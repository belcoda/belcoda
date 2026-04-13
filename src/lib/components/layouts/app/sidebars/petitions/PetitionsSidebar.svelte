<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import DesktopNavSidebar from '$lib/components/layouts/app/navigation/DesktopNavSidebar.svelte';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	const isMobile = new IsMobile();
	import { appState, getListFilter } from '$lib/state.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';
	import type { PetitionListFilter } from '$lib/zero/query/petition/list';
	import { page } from '$app/state';
	import Avatar from '$lib/components/widgets/avatar/Avatar.svelte';
	import ColorBadge from '$lib/components/ui/colorbadge/badge.svelte';
	import { t } from '$lib/index.svelte';

	import PetitionFilter from '$lib/components/layouts/app/sidebars/petitions/filter/PetitionFilter.svelte';

	let petitionListFilter: PetitionListFilter = $state({
		...getListFilter(appState.organizationId),
		status: null,
		tagId: null
	});

	const petitionList = $derived.by(() => z.createQuery(queries.petition.list(petitionListFilter)));
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
				<div class="text-2xl font-bold text-foreground">{t`Petitions`}</div>
				<Button href="/petitions/new" variant="outline">
					<PlusIcon class="size-5" />
				</Button>
			</div>
			<PetitionFilter bind:filter={petitionListFilter} />
		</Sidebar.Header>
		<Sidebar.Content>
			<Sidebar.Group class="p-0">
				<Sidebar.GroupContent class="h-full p-0">
					<div class="flex flex-col">
						{#if petitionList.data && petitionList.data.length > 0}
							{#each petitionList.data as petition (petition.id)}
								<a
									href={`/petitions/${petition.id}`}
									class="flex w-full items-center justify-start gap-3 border-b px-2 py-3 last:border-b-0 hover:bg-muted"
									class:bg-muted={page.url.pathname.startsWith(`/petitions/${petition.id}`)}
								>
									<div class="w-12">
										<Avatar
											src={petition.featureImage}
											name1={petition.title}
											class="size-12 rounded-lg"
											imageClass="rounded-lg object-cover"
										/>
									</div>
									<div class="grow">
										<div class="flex w-full items-center justify-start gap-2">
											<div class="line-clamp-1 text-sm font-medium">{petition.title}</div>
										</div>
										<div class="text-xs text-muted-foreground">
											{petition.petitionTarget || t`No target specified`}
										</div>
									</div>
									<ColorBadge
										color={petition.archivedAt ? 'yellow' : petition.published ? 'green' : 'gray'}
									>
										{petition.archivedAt
											? t`Archived`
											: petition.published
												? t`Published`
												: t`Draft`}
									</ColorBadge>
								</a>
							{/each}
						{/if}
						{#if petitionList.details.type === 'unknown'}
							{@render petitionItemSkeleton()}
							{@render petitionItemSkeleton()}
							{@render petitionItemSkeleton()}
						{:else if petitionList.details.type === 'error'}
							<div>Error loading petitions</div>
						{/if}
						{#if petitionList.details.type === 'complete' && (!petitionList.data || petitionList.data.length === 0)}
							<Empty.Root>
								<Empty.Header>
									<Empty.Media variant="icon">
										<FileTextIcon />
									</Empty.Media>
									<Empty.Title>{t`No petitions found`}</Empty.Title>
									<Empty.Description>
										{t`No petitions found. Create a new petition to get started.`}
									</Empty.Description>
									<Empty.Content>
										<Button href="/petitions/new">{t`Create Petition`}</Button>
									</Empty.Content>
								</Empty.Header>
							</Empty.Root>
						{/if}
					</div>
				</Sidebar.GroupContent>
			</Sidebar.Group>
		</Sidebar.Content>
	</Sidebar.Root>
</Sidebar.Root>

{#snippet petitionItemSkeleton()}
	<div
		class="flex w-full items-center justify-start gap-3 border-b px-2 py-3 last:border-b-0 hover:bg-muted"
	>
		<Skeleton class="size-12 rounded-lg" />
		<div class="grow">
			<Skeleton class="h-4 w-full" />
			<Skeleton class="h-4 w-full" />
		</div>
	</div>
{/snippet}
