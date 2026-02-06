<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import CheckIcon from '@lucide/svelte/icons/check';
	import { cn } from '$lib/utils.js';
	import { toast } from 'svelte-sonner';
	import { t } from '$lib/index.svelte';
	let {
		text,
		class: className,
		showText = false
	}: { text: string | null; class?: string; showText?: boolean } = $props();
	let copied = $state(false);
	const copiedTextLabel = (text: string) => {
		return t`Copied "${text}" to clipboard`;
	};
</script>

<Button
	variant="ghost"
	size="sm"
	class={cn('text-muted-foreground', className)}
	onclick={() => {
		if (text) {
			navigator.clipboard.writeText(text);
			copied = true;
			toast.success(copiedTextLabel(text));
			setTimeout(() => {
				copied = false;
			}, 1000);
		}
	}}
	>{#if copied}{#if showText}{t`Copied! `}{/if}<CheckIcon
			class="size-3.5"
		/>{:else}{#if showText}{t`Copy `}{/if}<CopyIcon class="size-3.5" />{/if}</Button
>
