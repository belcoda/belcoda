<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import ActionsMenu from '$lib/components/layouts/app/sidebars/community/ActionsMenu.svelte';
	import DesktopNavSidebar from '$lib/components/layouts/app/navigation/DesktopNavSidebar.svelte';
	import EmailFoldersSidebar from '$lib/components/communications/email/EmailFoldersSidebar.svelte';
	import EmailList from '$lib/components/communications/email/EmailList.svelte';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	import { page } from '$app/state';

	const isMobile = new IsMobile();

	const folder = $derived.by(() => {
		if (page.url.pathname.includes('/sent')) return 'sent';
		return 'drafts';
	});
</script>

<Sidebar.Root
	collapsible={!isMobile.current ? 'icon' : 'none'}
	class="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
>
	{#if !isMobile.current}
		<DesktopNavSidebar />
	{/if}

	<Sidebar.Root collapsible="none" class="flex w-full flex-1">
		<Sidebar.Content class="p-0">
			<div class="flex h-full flex-1 overflow-hidden">
				<!-- Folders Sidebar -->
				<EmailFoldersSidebar />
			</div>
		</Sidebar.Content>
	</Sidebar.Root>

	<Sidebar.Root collapsible="none" class="flex w-full flex-1">
		<Sidebar.Content class="p-0">
			<div class="flex h-full flex-1 overflow-hidden">
				<!-- Email List -->
				<EmailList {folder} />
			</div>
		</Sidebar.Content>
	</Sidebar.Root>
</Sidebar.Root>
