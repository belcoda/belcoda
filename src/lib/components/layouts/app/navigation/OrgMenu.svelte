<script lang="ts">
	import PlusIcon from '@lucide/svelte/icons/circle-plus';
	import UserIcon from '@lucide/svelte/icons/user';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { useSidebar } from '$lib/components/ui/sidebar/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	const sidebar = useSidebar();
	import { appState } from '$lib/state.svelte';
	import GradientBorder from '$lib/components/widgets/GradientBorder.svelte';
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import { t } from '$lib/index.svelte';
	const organizations = appState.organizations;
	const activeOrganization = appState.activeOrganization;
	const users = appState.organizationUsers;

	function renderRole(role: unknown) {
		if (role === 'admin') {
			return 'Admin';
		} else if (role === 'user') {
			return 'User';
		} else if (role === 'owner') {
			return 'Owner';
		} else {
			return 'Unknown';
		}
	}
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Sidebar.MenuButton
				{...props}
				size="lg"
				data-testid="org-menu-trigger"
				class="transition-transform hover:scale-110 hover:bg-gray-700 data-[state=open]:scale-110 data-[state=open]:bg-gray-700 data-[state=open]:text-sidebar-accent-foreground md:h-12 md:p-0"
			>
				{#if activeOrganization.details.type === 'complete' && activeOrganization.data}
					<div
						class="relative flex aspect-square w-full items-center justify-center rounded-lg p-1.5 text-sidebar-primary-foreground md:p-2"
					>
						<GradientBorder class="aspect-square w-full rounded-[0.3rem]">
							<img
								src={activeOrganization.data?.icon ||
									'https://belcoda-public-prod.s3.eu-central-1.amazonaws.com/system/images/logo-full.png'}
								alt="logo"
								class="aspect-square w-full rounded-[calc(0.3rem)]"
							/>
						</GradientBorder>
						<span class="sr-only truncate font-medium">{activeOrganization.data.name}</span>
					</div>
				{:else}
					<Skeleton class="h-8 w-8 rounded-lg" />
				{/if}
			</Sidebar.MenuButton>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content
		class="my-2 w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
		side={sidebar.isMobile ? 'top' : 'right'}
		align="end"
		sideOffset={4}
	>
		<DropdownMenu.Label class="p-0 font-normal">
			{#if activeOrganization.details.type === 'complete' && activeOrganization.data}
				<div class="flex items-start gap-2 px-1 py-1.5 text-left text-sm">
					<Avatar.Root class="size-12 rounded-sm">
						<Avatar.Image src={activeOrganization.data.icon} alt={activeOrganization.data.name} />
						<Avatar.Fallback class="rounded-lg"
							>{activeOrganization.data.name.charAt(0)}</Avatar.Fallback
						>
					</Avatar.Root>
					<div class="grid flex-1 text-left text-sm leading-tight">
						<div class="flex items-center gap-2">
							<span class="truncate text-base font-medium">{activeOrganization.data.name}</span>
						</div>
						{#if users.details.type === 'complete' && users.data}
							<div class="mt-1 flex items-center gap-1">
								{@render userCountBadge(users.data.length)}
								{#if appState.isAdminOrOwner}
									{@render inviteBadge()}
								{/if}
							</div>
						{:else}
							<Skeleton class="h-3 w-[20px]" />
						{/if}
					</div>
				</div>
			{:else}
				{@render orgSkeleton()}
			{/if}
		</DropdownMenu.Label>
		<DropdownMenu.Separator />
		{#if appState.isAdminOrOwner}
			<DropdownMenu.Group>
				<DropdownMenu.Item>
					{#snippet child({ props })}
						<a
							href="/settings"
							class="flex items-center gap-2"
							{...props}
							data-testid="org-menu-settings"
						>
							<SettingsIcon />
							{t`Settings`}
						</a>
					{/snippet}
				</DropdownMenu.Item>
			</DropdownMenu.Group>
			<DropdownMenu.Separator />
		{/if}
		{#if organizations.data}
			<DropdownMenu.Group>
				<DropdownMenu.Label>{t`Organizations`}</DropdownMenu.Label>
				{#each organizations.data as organization}
					<DropdownMenu.CheckboxItem
						class="flex items-center gap-2"
						checked={organization.id === appState.organizationId}
						onclick={async () => {
							appState.organizationId = organization.id;
							sessionStorage.setItem('state:organizationId', organization.id);
							await authClient.organization.setActive({
								organizationId: organization.id
							});
							await goto('/');
						}}
					>
						<div class="flex items-center gap-2">
							<img
								src={organization.icon || organization.logo}
								alt={organization.name}
								class="size-6 rounded-xs bg-linear-to-br from-primary to-primary/50"
							/>
							{organization.name}
							{@render memberRoleBadge(organization.memberships[0].role)}
						</div>
					</DropdownMenu.CheckboxItem>
				{/each}
			</DropdownMenu.Group>
		{:else}
			<DropdownMenu.Item>
				{@render orgSkeleton()}
			</DropdownMenu.Item>
		{/if}
		<DropdownMenu.Separator />
		<DropdownMenu.Item>
			<a class="flex items-center gap-2" href="/organization/new">
				<PlusIcon />
				New Organization
			</a>
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>

{#snippet orgSkeleton()}
	<div class="flex items-center space-x-1">
		<Skeleton class="size-5 rounded-full" />
		<div class="space-y-2">
			<Skeleton class="h-3 w-[100px]" />
		</div>
	</div>
{/snippet}

{#snippet userCountBadge(count: number)}
	<span class="flex items-center gap-1 rounded bg-accent px-1.5 py-0.5 text-xs font-medium">
		<UserIcon class="size-3" />
		{count}
		{t`users`}
	</span>
{/snippet}

{#snippet inviteBadge()}
	<a
		href="/settings/users"
		class=" text-heading flex items-center gap-1 rounded border bg-background px-1.5 py-0.5 text-xs font-medium hover:bg-accent"
	>
		<PlusIcon class="size-3" />
		{t`Invite?`}</a
	>
{/snippet}

{#snippet memberRoleBadge(role: unknown)}
	{#if role === 'admin'}
		<span
			class="rounded border border-green-100 bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-800"
			>{t`Admin`}</span
		>
	{:else if role === 'member'}
		<span
			class="rounded border border-blue-100 bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-800"
			>{t`Member`}</span
		>
	{:else if role === 'owner'}
		<span
			class="rounded border border-green-100 bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-800"
			>{t`Owner`}</span
		>
	{:else}
		<span
			class="rounded border border-gray-100 bg-gray-50 px-1.5 py-0.5 text-xs font-medium text-gray-800"
			>{t`Unknown`}</span
		>
	{/if}
{/snippet}
