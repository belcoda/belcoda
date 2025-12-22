<script lang="ts">
	import type { Snippet } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';

	const isDesktop = new MediaQuery('(min-width: 768px)');

	const id = $props.id();
	type Props = {
		title?: string;
		description?: string;
		children: Snippet;
		trigger?: Snippet;
		footer?: Snippet;
		open?: boolean;
	};
	let { title, description, children, trigger, footer, open = $bindable(false) }: Props = $props();
</script>

{#if isDesktop.current}
	<Dialog.Root bind:open>
		{#if trigger}<Dialog.Trigger>{@render trigger?.()}</Dialog.Trigger>{/if}
		<Dialog.Content class="sm:max-w-[425px]">
			<Dialog.Header>
				{#if title}<Dialog.Title>{title}</Dialog.Title>{/if}
				{#if description}<Dialog.Description>{description}</Dialog.Description>{/if}
			</Dialog.Header>
			<form class="grid items-start gap-4">
				{@render children?.()}
			</form>
			{#if footer}<Dialog.Footer class="pt-2">{@render footer?.()}</Dialog.Footer>{/if}
		</Dialog.Content>
	</Dialog.Root>
{:else}
	<Drawer.Root bind:open>
		{#if trigger}<Drawer.Trigger>{@render trigger?.()}</Drawer.Trigger>{/if}
		<Drawer.Content>
			<Drawer.Header class="text-start">
				{#if title}<Drawer.Title>{title}</Drawer.Title>{/if}
				{#if description}<Drawer.Description>{description}</Drawer.Description>{/if}
			</Drawer.Header>
			<form class="grid items-start gap-4 px-4">
				{@render children?.()}
			</form>
			{#if footer}<Drawer.Footer class="pt-2">{@render footer?.()}</Drawer.Footer>{/if}
		</Drawer.Content>
	</Drawer.Root>
{/if}
