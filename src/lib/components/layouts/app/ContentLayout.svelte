<script lang="ts">
	import type { Snippet } from 'svelte';
	let {
		header,
		footer,
		children,
		rootLink,
		bodyPadding = 'p-4'
	}: {
		header?: Snippet;
		footer?: Snippet;
		children: Snippet;
		rootLink: `/${string}`;
		bodyPadding?: string;
	} = $props();

	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
</script>

<div class="relative flex h-screen flex-col overflow-hidden">
	{#if header}<header class="flex shrink-0 items-center gap-2 border-b bg-background p-4">
			{#if rootLink}
				<a href={rootLink} class={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'py-5')}>
					<ChevronLeftIcon class="size-5" />
				</a>
			{/if}
			<div class="w-full">{@render header?.()}</div>
		</header>
	{/if}

	<div class="flex w-full flex-1 flex-col gap-4 overflow-y-auto {bodyPadding}">
		{@render children?.()}
	</div>
	{#if footer}
		<footer class="flex shrink-0 items-center gap-2 border-t bg-background p-4">
			{@render footer?.()}
		</footer>
	{/if}
</div>
