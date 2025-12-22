<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import ActionsMenu from '$lib/components/layouts/app/sidebars/community/ActionsMenu.svelte';
	import DesktopNavSidebar from '$lib/components/layouts/app/navigation/DesktopNavSidebar.svelte';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	const isMobile = new IsMobile();
	import Avatar from '$lib/components/widgets/avatar/Avatar.svelte';
	import { page } from '$app/state';
	import { type ReadPersonZero } from '$lib/schema/person';
	import { formatShortTimestamp } from '$lib/utils/date';

	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import SearchIcon from '@lucide/svelte/icons/search';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import { Button } from '$lib/components/ui/button/index.js';
	const activeTab = 'border-indigo-500 text-indigo-600';

	const isWhatsApp = $derived(page.url.pathname.startsWith('/communications/whatsapp'));
	const isEmail = $derived(page.url.pathname.startsWith('/communications/email'));
</script>

<Sidebar.Root
	collapsible={!isMobile.current ? 'icon' : 'none'}
	class="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
>
	{#if !isMobile.current}
		<DesktopNavSidebar />
	{/if}
	<Sidebar.Root collapsible="none" class="flex w-full flex-1">
		<Sidebar.Header class="gap-3.5 border-b p-0">
			<div class="flex w-full items-center justify-between px-4 pt-4">
				<div class="text-2xl font-bold text-foreground">Communications</div>
				<ActionsMenu />
			</div>
			<div class="mb-4 flex flex-col gap-4">
				<div class="border-b border-gray-200">
					<nav aria-label="Tabs" class="-mb-px flex">
						<a
							class="w-1/2 border-b-2 px-1 pt-2 pb-4 text-center text-sm font-medium text-gray-500"
							class:border-primary={isWhatsApp}
							class:text-primary={isWhatsApp}
							class:border-transparent={!isWhatsApp}
							class:hover:border-gray-300={!isWhatsApp}
							class:hover:text-gray-700={!isWhatsApp}
							href="/communications/whatsapp">WhatsApp</a
						>
						<a
							class:border-primary={isEmail}
							class:text-primary={isEmail}
							class:border-transparent={!isEmail}
							class:hover:border-gray-300={!isEmail}
							class:hover:text-gray-700={!isEmail}
							href="/communications/email"
							class="w-1/2 border-b-2 px-1 pt-2 pb-4 text-center text-sm font-medium text-gray-500"
							>Email</a
						>
					</nav>
				</div>
				<div class="flex flex-col gap-4 px-4">
					{#if isWhatsApp}
						<Button href="/communications/whatsapp/new" class="w-full"
							><span class="icon-[mage--whatsapp-filled] size-6"></span> Compose WhatsApp</Button
						>
					{/if}
					{#if isEmail}
						<Button href="/communications/email/new" class="w-full"
							><span class="icon-[mdi--email] size-5"></span> Compose email</Button
						>
					{/if}
					<div class="flex justify-between gap-2">
						<Tabs.Root value="drafts">
							<Tabs.List>
								<Tabs.Trigger value="drafts">Drafts</Tabs.Trigger>
								<Tabs.Trigger value="sent">Sent</Tabs.Trigger>
							</Tabs.List>
						</Tabs.Root>
						<InputGroup.Root class="grow bg-background">
							<InputGroup.Input placeholder="Search..." />
							<InputGroup.Addon>
								<SearchIcon />
							</InputGroup.Addon>
						</InputGroup.Root>
					</div>
				</div>
			</div>
		</Sidebar.Header>
		<Sidebar.Content>
			<Sidebar.Group>
				<Sidebar.GroupLabel>WhatsApp</Sidebar.GroupLabel>
				<Sidebar.GroupContent>
					<Sidebar.Menu>
						<Sidebar.MenuItem>
							<Sidebar.MenuButton>
								<span>Drafts</span>
							</Sidebar.MenuButton>
							<Sidebar.MenuAction>
								{#snippet child({ props })}
									<a href="/communications/whatsapp/drafts" {...props}>
										<EllipsisIcon />
										<span class="sr-only">All drafts</span>
									</a>
								{/snippet}
							</Sidebar.MenuAction>
						</Sidebar.MenuItem>
						<Sidebar.MenuItem>
							<Sidebar.MenuButton>
								<span>Sent</span>
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
					</Sidebar.Menu>
				</Sidebar.GroupContent>
			</Sidebar.Group>
			<Sidebar.Group>
				<Sidebar.GroupLabel>Email</Sidebar.GroupLabel>
				<Sidebar.GroupContent>
					<Sidebar.Menu>
						<Sidebar.MenuItem>
							<Sidebar.MenuButton>
								<span>Drafts</span>
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
						<Sidebar.MenuItem>
							<Sidebar.MenuButton>
								<span>Sent</span>
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
					</Sidebar.Menu>
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
