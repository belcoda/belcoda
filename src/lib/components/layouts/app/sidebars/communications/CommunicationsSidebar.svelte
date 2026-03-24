<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import DesktopNavSidebar from '$lib/components/layouts/app/navigation/DesktopNavSidebar.svelte';
	import FoldersSidebar from '$lib/components/layouts/app/sidebars/communications/FoldersSidebar.svelte';
	import EmailList from '$lib/components/layouts/app/sidebars/communications/EmailList.svelte';
	import WhatsAppList from '$lib/components/layouts/app/sidebars/communications/WhatsAppList.svelte';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	import { page } from '$app/state';

	const isMobile = new IsMobile();

	const folder = $derived.by(() => {
		if (page.url.pathname.includes('/sent')) return 'sent';
		return 'drafts';
	});

	const isWhatsApp = $derived(page.url.pathname.startsWith('/communications/whatsapp'));
	const isEmail = $derived(page.url.pathname.startsWith('/communications/email'));
	const isEmailDrafts = $derived(page.url.pathname.startsWith('/communications/email/drafts'));
	const isEmailSent = $derived(page.url.pathname.startsWith('/communications/email/sent'));
	const isWhatsAppDrafts = $derived(
		page.url.pathname.startsWith('/communications/whatsapp/drafts')
	);
	const isWhatsAppSent = $derived(page.url.pathname.startsWith('/communications/whatsapp/sent'));
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
				<FoldersSidebar />
			</div>
		</Sidebar.Content>
	</Sidebar.Root>

	<Sidebar.Root collapsible="none" class="flex w-full flex-1">
		<Sidebar.Content class="p-0">
			<div class="flex h-full flex-1 overflow-hidden">
				<!-- Email List -->
				{#if isEmail}
					<EmailList {folder} />
				{:else if isWhatsApp}
					<WhatsAppList {folder} />
				{/if}
			</div>
		</Sidebar.Content>
	</Sidebar.Root>
</Sidebar.Root>
