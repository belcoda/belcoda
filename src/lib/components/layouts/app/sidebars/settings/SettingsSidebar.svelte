<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import DesktopNavSidebar from '$lib/components/layouts/app/navigation/DesktopNavSidebar.svelte';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	import { page } from '$app/state';
	const isMobile = new IsMobile();
	import Fuse from 'fuse.js';
	let searchString = $state('');
	const fuse = new Fuse(settingsItems, {
		includeScore: true,
		keys: ['title', 'keywords', 'items.title', 'items.keywords'],
		threshold: 0.2
	});
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import SearchIcon from '@lucide/svelte/icons/search';
	import { settingsItems, groupBy } from '$lib/components/layouts/app/sidebars/settings/items';

	import { appState } from '$lib/state.svelte';
	const result = $derived.by(() => {
		if (searchString === '') {
			const filteredItems = settingsItems.filter((item) => {
				if (appState.isOwner) {
					return true;
				} else if (appState.isAdmin) {
					return item.permissions === 'admin' || item.permissions === 'member';
				} else {
					return false;
				}
			});
			return groupBy(filteredItems, 'group');
		} else {
			const results = fuse.search(searchString).map((item) => {
				return item.item;
			});
			const filteredResults = results.filter((item) => {
				if (appState.isOwner) {
					return true;
				} else if (appState.isAdmin) {
					return item.permissions === 'admin' || item.permissions === 'member';
				} else {
					return false;
				}
			});
			return groupBy(filteredResults, 'group');
		}
	});
	import H2 from '$lib/components/ui/typography/H2.svelte';
	import { t } from '$lib/index.svelte';
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
				<H2>{t`Settings`}</H2>
			</div>
			<InputGroup.Root class="bg-background">
				<InputGroup.Input placeholder="Search..." bind:value={searchString} />
				<InputGroup.Addon>
					<SearchIcon />
				</InputGroup.Addon>
			</InputGroup.Root>
		</Sidebar.Header>
		<Sidebar.Content>
			{#each result as group}
				<Sidebar.Group>
					<Sidebar.GroupLabel>{group.group}</Sidebar.GroupLabel>
					<Sidebar.GroupContent>
						<Sidebar.Menu>
							{#each group.items as item (item.url)}
								<Sidebar.MenuItem>
									<Sidebar.MenuButton isActive={page.url.pathname === item.url}>
										{#snippet child({ props })}
											<a href={item.url} {...props}>{item.title()}</a>
										{/snippet}
									</Sidebar.MenuButton>
								</Sidebar.MenuItem>
							{/each}
						</Sidebar.Menu>
					</Sidebar.GroupContent>
				</Sidebar.Group>
			{/each}
		</Sidebar.Content>
	</Sidebar.Root>
</Sidebar.Root>
