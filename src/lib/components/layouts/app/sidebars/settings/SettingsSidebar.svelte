<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import DesktopNavSidebar from '$lib/components/layouts/app/navigation/DesktopNavSidebar.svelte';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	import { page } from '$app/state';
	const isMobile = new IsMobile();
	import Fuse from 'fuse.js';
	let searchString = $state('');

	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import SearchIcon from '@lucide/svelte/icons/search';
	import { settingsItems, groupBy } from '$lib/components/layouts/app/sidebars/settings/items';

	import { appState } from '$lib/state.svelte';

	const fuse = new Fuse(settingsItems, {
		includeScore: true,
		keys: ['title', 'keywords'],
		threshold: 0.2
	});

	const filtered = $derived.by(() => {
		const base =
			searchString === '' ? settingsItems : fuse.search(searchString).map((item) => item.item);
		return base.filter((item) => {
			if (item.scope === 'account') {
				return true;
			} else if (appState.isOwner) {
				return true;
			} else if (appState.isAdmin) {
				return item.permissions === 'admin' || item.permissions === 'member';
			} else {
				return false;
			}
		});
	});

	const accountGroups = $derived(
		groupBy(
			filtered.filter((item) => item.scope === 'account'),
			'group'
		)
	);
	const workspaceGroups = $derived(
		groupBy(
			filtered.filter((item) => item.scope === 'workspace'),
			'group'
		)
	);

	const orgName = $derived(
		appState.activeOrganization.details.type === 'complete'
			? appState.activeOrganization.data?.name
			: undefined
	);

	import H2 from '$lib/components/ui/typography/H2.svelte';
	import { t } from '$lib/index.svelte';
	import UserIcon from '@lucide/svelte/icons/user';
	import BuildingIcon from '@lucide/svelte/icons/building';
	import type { Component } from 'svelte';
</script>

{#snippet scopeSection(
	Icon: Component,
	label: string,
	subtitle: string,
	groups: typeof accountGroups,
	showGroupLabel: boolean,
	withDivider: boolean
)}
	{#if groups.length}
		<div class="px-3 pt-4 pb-1 {withDivider ? 'mt-2 border-t border-sidebar-border pt-5' : ''}">
			<div class="flex items-center gap-2">
				<Icon class="size-4 text-muted-foreground" />
				<span class="text-xs font-semibold tracking-wide text-foreground uppercase">{label}</span>
			</div>
			<p class="mt-0.5 pl-6 text-xs text-muted-foreground">{subtitle}</p>
		</div>
		{#each groups as group}
			<Sidebar.Group class="py-1 pl-3">
				{#if showGroupLabel}<Sidebar.GroupLabel class="text-[0.7rem] tracking-wide uppercase"
						>{group.group}</Sidebar.GroupLabel
					>{/if}
				<Sidebar.GroupContent>
					<Sidebar.Menu>
						{#each group.items as item (item.url)}
							<Sidebar.MenuItem>
								<Sidebar.MenuButton isActive={page.url.pathname === item.url}>
									{#snippet child({ props })}
										<a href={item.url} {...props} data-testid={item.dataTestId}>{item.title()}</a>
									{/snippet}
								</Sidebar.MenuButton>
							</Sidebar.MenuItem>
						{/each}
					</Sidebar.Menu>
				</Sidebar.GroupContent>
			</Sidebar.Group>
		{/each}
	{/if}
{/snippet}

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
			{@render scopeSection(UserIcon, t`Account`, t`Just you`, accountGroups, false, false)}
			{@render scopeSection(
				BuildingIcon,
				t`Workspace`,
				orgName ? t`Everyone in ${orgName}` : t`Everyone in your workspace`,
				workspaceGroups,
				true,
				true
			)}
		</Sidebar.Content>
	</Sidebar.Root>
</Sidebar.Root>
