<script lang="ts">
	import { cn } from '$lib/utils';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '$lib/utils';
	let {
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
	class={cn(className, 'bg-linear-to-br from-gray-100/90 via-gray-200/10 to-gray-100/90 p-px')}
	{...restProps}
>
	{@render children?.()}
</div>
