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

	import { Button } from '$lib/components/ui/button/index.js';
	import { t } from '$lib/index.svelte';

	const isDrafts = $derived(page.url.pathname.includes('/drafts'));
	const isSent = $derived(page.url.pathname.includes('/sent'));
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
				<div class="text-2xl font-bold text-foreground">{t`Communications`}</div>
				<ActionsMenu />
			</div>
			<div class="mb-4 px-4 pt-4">
				<Button href="/communications/email/drafts/new" class="w-full" size="lg">
					<span class="icon-[mdi--email] size-5"></span> {t`Compose Email`}
				</Button>
			</div>
		</Sidebar.Header>
		<Sidebar.Content>
			<Sidebar.Group>
				<Sidebar.GroupContent>
					<Sidebar.Menu>
						<Sidebar.MenuItem>
							<a href="/communications/email/drafts">
								<Sidebar.MenuButton isActive={isDrafts}>
									<span>{t`Drafts`}</span>
								</Sidebar.MenuButton>
							</a>
						</Sidebar.MenuItem>
						<Sidebar.MenuItem>
							<a href="/communications/sent">
								<Sidebar.MenuButton isActive={isSent}>
									<span>{t`Sent`}</span>
								</Sidebar.MenuButton>
							</a>
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
