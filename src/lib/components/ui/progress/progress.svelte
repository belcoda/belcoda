<script lang="ts">
	import { Progress as ProgressPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		value = null,
		max = 100,
		indicatorClass,
		...restProps
	}: ProgressPrimitive.RootProps & {
		indicatorClass?: string;
	} = $props();
</script>

<ProgressPrimitive.Root
	bind:ref
	{value}
	{max}
	class={cn('relative h-4 w-full overflow-hidden rounded-full bg-secondary', className)}
	{...restProps}
>
	<div
		class={cn('h-full w-full flex-1 bg-primary transition-all', indicatorClass)}
		style="transform: translateX(-{100 - ((value ?? 0) * 100) / (max ?? 1)}%)"
	></div>
</ProgressPrimitive.Root>
