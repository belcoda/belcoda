<script lang="ts">
	import { cn } from '$lib/utils';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		class: className,
		color,
		children,
		...restProps
	}: HTMLAttributes<HTMLSpanElement> & {
		color: 'gray' | 'red' | 'yellow' | 'green' | 'blue' | 'indigo' | 'purple' | 'pink';
	} = $props();
	// set the class name based on the color. it has to be done fairly manually, so generate the colors first for each version
	const colors = {
		gray: 'bg-gray-50 text-gray-600 inset-ring inset-ring-gray-500/10',
		red: 'bg-red-50 text-red-700 inset-ring inset-ring-red-600/10',
		yellow: 'bg-yellow-50 text-yellow-800 inset-ring inset-ring-yellow-600/20',
		green: 'bg-green-50 text-green-700 inset-ring inset-ring-green-600/20',
		blue: 'bg-blue-50 text-blue-700 inset-ring inset-ring-blue-700/10',
		indigo: 'bg-indigo-50 text-indigo-700 inset-ring inset-ring-indigo-700/10',
		purple: 'bg-purple-50 text-purple-700 inset-ring inset-ring-purple-700/10',
		pink: 'bg-pink-50 text-pink-700 inset-ring inset-ring-pink-700/10'
	};
	/* svelte-ignore state_referenced_locally */
	const colorClass = colors[color];
</script>

<span
	class={cn(
		'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium',
		colorClass,
		className
	)}
	{...restProps}
>
	{@render children?.()}
</span>
