<script lang="ts">
	import { MediaQuery } from 'svelte/reactivity';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	const isDesktop = new MediaQuery('(min-width: 768px)');
	import { cn } from '$lib/utils.js';
	import type { Snippet } from 'svelte';
	let {
		children,
		class: className,
		title,
		description,
		open = $bindable(false),
		trigger,
		direction = 'bottom'
	}: {
		children: Snippet;
		class?: string;
		title?: string;
		description?: string;
		open: boolean;
		trigger: Snippet;
		direction?: 'top' | 'bottom' | 'left' | 'right';
	} = $props();
</script>

{#if isDesktop.current}
	<Dialog.Root bind:open>
		<Dialog.Trigger>{@render trigger?.()}</Dialog.Trigger>
		<Dialog.Content class={cn('sm:max-w-[425px]', className)}>
			{#if title || description}
				<Dialog.Header>
					{#if title}<Dialog.Title>{title}</Dialog.Title>{/if}
					{#if description}<Dialog.Description>{description}</Dialog.Description>{/if}
				</Dialog.Header>
			{/if}
			<form class="grid items-start gap-4">
				{@render children?.()}
			</form>
		</Dialog.Content>
	</Dialog.Root>
{:else}
	<Drawer.Root bind:open {direction}>
		<Drawer.Trigger>{@render trigger?.()}</Drawer.Trigger>
		<Drawer.Content class="my-8">
			{#if title || description}
				<Drawer.Header class="text-start">
					{#if title}<Drawer.Title>{title}</Drawer.Title>{/if}
					{#if description}<Drawer.Description>{description}</Drawer.Description>{/if}
				</Drawer.Header>
			{/if}
			<form class="grid items-start gap-4 px-4">
				{@render children?.()}
			</form>
		</Drawer.Content>
	</Drawer.Root>
{/if}
