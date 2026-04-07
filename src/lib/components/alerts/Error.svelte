<script lang="ts">
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	let {
		title,
		children,
		...restProps
	}: { title?: string; children: Snippet } & HTMLAttributes<HTMLDivElement> = $props();
</script>

<Alert.Root variant="destructive" class="border-destructive/10 bg-destructive/5" {...restProps}>
	<CircleAlertIcon class="size-4" />
	{#if title}<Alert.Title>{title}</Alert.Title>{/if}
	<Alert.Description>{@render children?.()}</Alert.Description>
</Alert.Root>
