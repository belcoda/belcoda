<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';
	let { children, className }: { children: Snippet; className?: string } = $props();
</script>

<h1 class={cn('scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl', className)}>
	{@render children?.()}
</h1>
