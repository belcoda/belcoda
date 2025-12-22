<script lang="ts">
	import { cn } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';
	import { getAvatarFallback } from './utils.js';
	import { type Snippet } from 'svelte';
	type Props = {
		src?: string | null;
		alt?: string;
		name1: string;
		name2?: string | null | undefined;
		children?: Snippet;
		imageRef?: HTMLImageElement | null;
		fallbackHidden?: boolean;
		imageClass?: string;
	} & HTMLAttributes<HTMLDivElement>;
	let {
		class: className,
		src,
		alt,
		name1,
		name2,
		children,
		imageRef,
		fallbackHidden = false,
		imageClass,
		...restProps
	}: Props = $props();
	import CircleHelp from '@lucide/svelte/icons/circle-help';
</script>

<div
	class={cn(
		'flex aspect-square size-full items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-primary to-sky-800 font-extrabold text-white',
		className
	)}
	{...restProps}
>
	{#if src}
		<img
			{src}
			alt={alt || getAvatarFallback(name1, name2)}
			bind:this={imageRef}
			class={cn('h-full w-full rounded-full object-cover', imageClass)}
		/>
	{:else if (name1 || name2) && !fallbackHidden}
		{getAvatarFallback(name1, name2)}
	{:else if !fallbackHidden}<CircleHelp class="size-5" />{/if}
	{#if children}{@render children()}{/if}
</div>
