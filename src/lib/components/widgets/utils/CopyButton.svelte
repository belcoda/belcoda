<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import CheckIcon from '@lucide/svelte/icons/check';
	import { cn } from '$lib/utils.js';
	import { toast } from 'svelte-sonner';
	let {
		text,
		class: className,
		showText = false
	}: { text: string | null; class?: string; showText?: boolean } = $props();
	let copied = $state(false);
</script>

<Button
	variant="ghost"
	size="sm"
	class={cn('text-muted-foreground', className)}
	onclick={() => {
		if (text) {
			navigator.clipboard.writeText(text);
			copied = true;
			toast.success(`Copied "${text}" to clipboard`);
			setTimeout(() => {
				copied = false;
			}, 1000);
		}
	}}
	>{#if copied}{#if showText}{`Copied! `}{/if}<CheckIcon
			class="size-3.5"
		/>{:else}{#if showText}{`Copy `}{/if}<CopyIcon class="size-3.5" />{/if}</Button
>
