<script lang="ts">
	import BadgeCheckIcon from '@lucide/svelte/icons/badge-check';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import Avatar from '$lib/components/widgets/avatar/Avatar.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { useSidebar } from '$lib/components/ui/sidebar/index.js';
	import { appState } from '$lib/state.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';
	import { t } from '$lib/index.svelte';
	const userQuery = $derived.by(() =>
		z.createQuery(queries.user.read({ userId: appState.userId }))
	);
	const teamQuery = $derived.by(() =>
		z.createQuery(
			queries.team.listMyTeams({
				userId: appState.userId,
				organizationId: appState.organizationId
			})
		)
	);
	const sidebar = useSidebar();
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			{#if appState.user.details.type === 'complete' && appState.user.data}
				<Sidebar.MenuButton
					{...props}
					size="lg"
					class="mx-auto transition-transform hover:scale-110 hover:bg-gray-700 data-[state=open]:scale-110 data-[state=open]:bg-gray-700 data-[state=open]:text-sidebar-accent-foreground md:h-12 md:p-0"
				>
					<div
						class="relative flex aspect-square w-full items-center justify-center rounded-lg p-2 text-sidebar-primary-foreground"
					>
						<Avatar
							src={appState.user.data.image}
							alt={appState.user.data.name}
							name1={appState.user.data.name}
						/>
						<span class="sr-only truncate font-medium">{appState.user.data.name}</span>
					</div>
				</Sidebar.MenuButton>
			{:else}
				<Skeleton class="h-8 w-8 rounded-lg" />
			{/if}
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content
		class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
		side={sidebar.isMobile ? 'bottom' : 'right'}
		align="end"
		sideOffset={4}
	>
		<DropdownMenu.Label class="p-0 font-normal">
			{#if userQuery.details.type === 'complete' && userQuery.data}
				<div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
					<Avatar
						name1={userQuery.data.name}
						name2={userQuery.data.email}
						src={userQuery.data.image}
						class="size-8"
					/>
					<div class="grid flex-1 text-left text-sm leading-tight">
						<span class="truncate font-medium">{userQuery.data.name}</span>
						<span class="truncate text-xs">{userQuery.data.email}</span>
					</div>
				</div>
			{:else}
				<Skeleton class="h-8 w-8 rounded-lg" />
			{/if}
		</DropdownMenu.Label>
		<DropdownMenu.Separator />
		<DropdownMenu.Group>
			<DropdownMenu.Item>
				{#snippet child({ props })}
					<a href="/preferences" {...props}>
						<SettingsIcon />
						{t`Preferences`}
					</a>
				{/snippet}
			</DropdownMenu.Item>
		</DropdownMenu.Group>
		<DropdownMenu.Separator />
		{#if teamQuery.details.type === 'complete' && teamQuery.data && teamQuery.data.length > 0}
			<DropdownMenu.Group>
				{#each teamQuery.data as team, index (index)}
					<DropdownMenu.Item>
						<a href={`/team/${team.id}`} class="flex w-full items-center gap-2">
							<BadgeCheckIcon />
							{team.name}
						</a>
					</DropdownMenu.Item>
				{/each}
			</DropdownMenu.Group>
			<DropdownMenu.Separator />
		{/if}
		<DropdownMenu.Item>
			<a href="/logout" class="flex w-full items-center gap-2" data-sveltekit-preload-data="tap">
				<LogOutIcon />
				{t`Log out`}
			</a>
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
