<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import DesktopNavSidebar from '$lib/components/layouts/app/navigation/DesktopNavSidebar.svelte';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	const isMobile = new IsMobile();
	import { appState } from '$lib/state.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';

	// TODO: Add petition queries and types when petition schema is implemented
	// const petitionList = $derived.by(() =>
	// 	z.createQuery(listPetitions(appState.queryContext, petitionListFilter))
	// );

	// Placeholder data structure. will be replaced with actual petition queries
	let petitions = $state<any[]>([]);
	let isLoading = $state(false);
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
				<div class="text-2xl font-bold text-foreground">Petitions</div>
				<Button href="/petitions/new" variant="outline">
					<PlusIcon class="size-5" />
				</Button>
			</div>
			<!-- TODO: Add petition filters -->
		</Sidebar.Header>
		<Sidebar.Content>
			<Sidebar.Group class="p-0">
				<Sidebar.GroupContent class="h-full p-0">
					<div class="flex flex-col">
						{#if isLoading}
							{@render petitionItemSkeleton()}
							{@render petitionItemSkeleton()}
							{@render petitionItemSkeleton()}
						{:else if petitions.length > 0}
							{#each petitions as petition (petition.id)}
								<!-- TODO: Create RenderPetition component -->
								<a
									href={`/petitions/${petition.id}`}
									class="flex w-full items-center justify-start gap-3 border-b px-2 py-3 last:border-b-0 hover:bg-muted"
								>
									<div class="w-12">
										<div class="flex size-12 items-center justify-center rounded-lg bg-muted">
											<FileTextIcon class="size-6 text-muted-foreground" />
										</div>
									</div>
									<div class="grow">
										<div class="line-clamp-1 text-sm font-medium">{petition.title}</div>
										<div class="text-xs text-muted-foreground">
											{petition.signatureCount || 0} signatures
										</div>
									</div>
								</a>
							{/each}
						{:else}
							<Empty.Root>
								<Empty.Header>
									<Empty.Media variant="icon">
										<FileTextIcon />
									</Empty.Media>
									<Empty.Title>No petitions found</Empty.Title>
									<Empty.Description>
										No petitions found. Create a new petition to get started.
									</Empty.Description>
									<Empty.Content>
										<Button href="/petitions/new">Create Petition</Button>
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
