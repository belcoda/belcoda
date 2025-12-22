<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import DesktopNavSidebar from '$lib/components/layouts/app/navigation/DesktopNavSidebar.svelte';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	import { page } from '$app/state';
	const isMobile = new IsMobile();
	import Fuse from 'fuse.js';
	let searchString = $state('');
	const fuse = new Fuse(preferencesItems, {
		includeScore: true,
		keys: ['title', 'keywords'],
		threshold: 0.2
	});
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import SearchIcon from '@lucide/svelte/icons/search';
	import { preferencesItems } from '$lib/components/layouts/app/sidebars/preferences/items';

	import { appState } from '$lib/state.svelte';
	const result = $derived.by(() => {
		if (searchString === '') {
			return preferencesItems.filter((item) => {
				if (appState.isOwner) {
					return true;
				} else if (appState.isAdmin) {
					return item.permissions === 'admin' || item.permissions === 'member';
				} else {
					return false;
				}
			});
		} else {
			const results = fuse.search(searchString).map((item) => {
				return item.item;
			});
			return results.filter((item) => {
				if (appState.isOwner) {
					return true;
				} else if (appState.isAdmin) {
					return item.permissions === 'admin' || item.permissions === 'member';
				} else {
					return false;
				}
			});
		}
	});
</script>

<Sidebar.Root
	collapsible={!isMobile.current ? 'icon' : 'none'}
	class="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
>
	{#if !isMobile.current}
		<DesktopNavSidebar />
	{/if}
	<Sidebar.Root collapsible="none" class="flex flex-1">
		<Sidebar.Header class="gap-3.5 border-b p-4">
			<div class="flex w-full items-center justify-between">
				<div class="text-2xl font-bold text-foreground">Preferences</div>
			</div>
			<InputGroup.Root class="bg-background">
				<InputGroup.Input placeholder="Search..." bind:value={searchString} />
				<InputGroup.Addon>
					<SearchIcon />
				</InputGroup.Addon>
			</InputGroup.Root>
		</Sidebar.Header>
		<Sidebar.Content>
			<Sidebar.Group>
				<Sidebar.GroupContent>
					<Sidebar.Menu>
						{#each result as item (item.title)}
							<Sidebar.MenuItem>
								<Sidebar.MenuButton isActive={page.url.pathname === item.url}>
									{#snippet child({ props })}
										<a href={item.url} {...props}>{item.title}</a>
									{/snippet}
								</Sidebar.MenuButton>
							</Sidebar.MenuItem>
						{/each}
					</Sidebar.Menu>
				</Sidebar.GroupContent>
			</Sidebar.Group>
		</Sidebar.Content>
	</Sidebar.Root>
</Sidebar.Root>
