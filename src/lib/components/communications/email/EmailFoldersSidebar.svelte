<script lang="ts">
	import FileIcon from '@lucide/svelte/icons/file';
	import SendIcon from '@lucide/svelte/icons/send';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';

	const navMain = [
		{
			title: 'Drafts',
			url: '/communications/email/drafts',
			icon: FileIcon
		},
		{
			title: 'Sent',
			url: '/communications/email/sent',
			icon: SendIcon
		}
	];

	const activeFolder = $derived(
		navMain.find((item) => page.url.pathname.includes(item.url.split('/').pop() || '')) ||
			navMain[0]
	);
</script>

<div class="flex h-full w-[180px] flex-col border-r bg-background">
	<div class="border-b p-3">
		<Button href="/communications/email/drafts/new" class="w-full" size="sm">
			<span class="icon-[mdi--email] size-4"></span> Compose
		</Button>
	</div>
	<nav class="flex flex-col gap-0.5 p-2">
		{#each navMain as item (item.title)}
			<a
				href={item.url}
				class="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted {activeFolder?.title === item.title ? 'bg-muted font-medium' : ''}"
			>
				<item.icon class="size-4" />
				<span>{item.title}</span>
			</a>
		{/each}
	</nav>
</div>
