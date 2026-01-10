<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';
	let { children, className }: { children: Snippet; className?: string } = $props();
</script>

<h2 class={cn('text-3xl font-bold tracking-tight text-foreground', className)}>
	{@render children?.()}
</h2>
