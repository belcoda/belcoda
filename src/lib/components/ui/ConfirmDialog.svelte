<script lang="ts">
	import { MediaQuery } from 'svelte/reactivity';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	const isDesktop = new MediaQuery('(min-width: 768px)');
	import { Button } from '$lib/components/ui/button/index.js';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';
	let {
		open = $bindable(false),
		title,
		description,
		confirmText = 'Confirm',
		cancelText = 'Cancel',
		confirmTestId,
		cancelTestId,
		confirmVariant = 'default',
		onConfirm,
		onCancel,
		children
	}: {
		open: boolean;
		title: string;
		description?: string;
		confirmText?: string;
		cancelText?: string;
		confirmTestId?: string;
		cancelTestId?: string;
		confirmVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
		onConfirm: () => void;
		onCancel?: () => void;
		children?: Snippet;
	} = $props();

	function handleCancel() {
		open = false;
		onCancel?.();
	}

	function handleConfirm() {
		open = false;
		onConfirm();
	}
</script>

{#if isDesktop.current}
	<Dialog.Root bind:open>
		<Dialog.Content class={cn('sm:max-w-[425px]')}>
			<Dialog.Header>
				<Dialog.Title>{title}</Dialog.Title>
				{#if description}
					<Dialog.Description>{description}</Dialog.Description>
				{/if}
			</Dialog.Header>
			{#if children}
				<div class="grid gap-4 py-4">
					{@render children?.()}
				</div>
			{/if}
			<div class="flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-2">
				<Button variant="outline" onclick={handleCancel} data-testid={cancelTestId}
					>{cancelText}</Button
				>
				<Button variant={confirmVariant} onclick={handleConfirm} data-testid={confirmTestId}
					>{confirmText}</Button
				>
			</div>
		</Dialog.Content>
	</Dialog.Root>
{:else}
	<Drawer.Root bind:open>
		<Drawer.Content class="my-8">
			<Drawer.Header class="text-start">
				<Drawer.Title>{title}</Drawer.Title>
				{#if description}
					<Drawer.Description>{description}</Drawer.Description>
				{/if}
			</Drawer.Header>
			{#if children}
				<div class="grid gap-4 px-4 py-4">
					{@render children?.()}
				</div>
			{/if}
			<div class="flex flex-col-reverse gap-2 px-4 pb-4">
				<Button variant="outline" onclick={handleCancel} data-testid={cancelTestId}
					>{cancelText}</Button
				>
				<Button variant={confirmVariant} onclick={handleConfirm} data-testid={confirmTestId}
					>{confirmText}</Button
				>
			</div>
		</Drawer.Content>
	</Drawer.Root>
{/if}
