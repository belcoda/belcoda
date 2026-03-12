<script lang="ts">
	import { t } from '$lib/index.svelte';
	import FileIcon from '@lucide/svelte/icons/file';
	import SendIcon from '@lucide/svelte/icons/send';
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { cn } from '$lib/utils.js';
</script>

<div class="flex h-full w-[180px] flex-col border-r bg-background">
	<div class="px-2 py-4">
		<DropdownMenu.Root>
			<DropdownMenu.Trigger
				class={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'w-full')}
			>
				<span class="icon-[lucide--pencil] size-4"></span>
				{t`Compose`}
				<span class="icon-[charm--chevron-down] size-4"></span>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content>
				<DropdownMenu.Item>
					{#snippet child({ props })}
						<a href="/communications/email/drafts/new" {...props}>
							<span class="icon-[mdi--email] size-4"></span>
							{t`Compose email`}
						</a>
					{/snippet}
				</DropdownMenu.Item>
				<DropdownMenu.Item>
					{#snippet child({ props })}
						<a href="/communications/whatsapp/drafts/new" {...props}>
							<span class="icon-[dashicons--whatsapp] size-4"></span>
							{t`Compose WhatsApp`}
						</a>
					{/snippet}
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
	<nav class="flex flex-col gap-1 p-2">
		<div class="p-2 text-xs font-extralight tracking-widest text-muted-foreground uppercase">
			{t`Email`}
		</div>

		{@render linkItem({
			url: '/communications/email/drafts',
			title: t`Drafts`,
			icon: draftIcon
		})}
		{@render linkItem({
			url: '/communications/email/sent',
			title: t`Sent`,
			icon: sentIcon
		})}
		<div class="p-2 pt-4 text-xs font-extralight tracking-widest text-muted-foreground uppercase">
			{t`WhatsApp`}
		</div>

		{@render linkItem({
			url: '/communications/whatsapp/drafts',
			title: t`Drafts`,
			icon: draftIcon
		})}
		{@render linkItem({
			url: '/communications/whatsapp/sent',
			title: t`Sent`,
			icon: sentIcon
		})}
	</nav>
</div>

{#snippet linkItem(item: { url: string; title: string; icon: Snippet })}
	<a
		href={item.url}
		class="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted {page.url.pathname.includes(
			item.url
		)
			? 'bg-muted font-medium'
			: ''}"
	>
		{@render item.icon()}
		<span>{item.title}</span>
	</a>
{/snippet}

{#snippet draftIcon()}
	<FileIcon class="size-4" />
{/snippet}

{#snippet sentIcon()}
	<SendIcon class="size-4" />
{/snippet}
