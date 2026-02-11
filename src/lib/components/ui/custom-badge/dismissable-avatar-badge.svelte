<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		src = null,
		color,
		class: className,
		avatarTitle,
		hideAvatar = false,
		hideRemove = false,
		title,
		onRemove
	}: {
		src: string | null;
		class?: string;
		avatarTitle?: string;
		hideRemove?: boolean;
		title: string;
		hideAvatar?: boolean;
		color: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'indigo' | 'pink' | 'gray';
		onRemove: () => void;
	} = $props();
	import { cn } from '$lib/utils';
	import Avatar from '$lib/components/widgets/avatar/Avatar.svelte';

	const colors = {
		blue: 'text-blue-900/80 bg-primary/10 border-primary/20',
		green: 'text-green-900/80 bg-green-500/10 border-green-500/20',
		red: 'text-red-900/80 bg-red-500/10 border-red-500/20',
		yellow: 'text-yellow-900/80 bg-yellow-500/10 border-yellow-500/20',
		purple: 'text-purple-900/80 bg-purple-500/10 border-purple-500/20',
		indigo: 'text-indigo-900/80 bg-indigo-500/10 border-indigo-500/20',
		pink: 'text-pink-900/80 bg-pink-500/10 border-pink-500/20',
		gray: 'text-gray-900/80 bg-linear-to-b from-gray-200 via-gray-50 to-gray-100 border-gray-300'
	};

	const avatarColor = {
		blue: 'from-primary to-sky-800',
		green: 'from-green-500 to-green-800',
		red: 'from-red-500 to-red-800',
		yellow: 'from-yellow-500 to-yellow-800',
		purple: 'from-purple-500 to-purple-800',
		indigo: 'from-indigo-500 to-indigo-800',
		pink: 'from-pink-500 to-pink-800',
		gray: 'from-gray-500 to-gray-800'
	};
	const buttonColor = {
		blue: 'hover:bg-primary/20',
		green: 'hover:bg-green-500/20',
		red: 'hover:bg-red-500/20',
		yellow: 'hover:bg-yellow-500/20',
		purple: 'hover:bg-purple-500/20',
		indigo: 'hover:bg-indigo-500/20',
		pink: 'hover:bg-pink-500/20',
		gray: 'hover:bg-gray-500/20'
	};
	/* svelte-ignore state_referenced_locally */
	const buttonColorClass = buttonColor[color];
	/* svelte-ignore state_referenced_locally */
	const avatarColorClass = avatarColor[color];
	/* svelte-ignore state_referenced_locally */
	const colorClass = colors[color];
</script>

<span
	class={cn(
		'line-clamp-1 inline-flex items-center gap-1 truncate rounded border py-0.5 ps-1.5 text-xs font-medium',
		colorClass,
		className,
		!hideRemove ? 'pe-0.5' : 'pe-1.5'
	)}
>
	{#if !hideAvatar}
		<Avatar
			class={cn('me-1 h-3.5 w-3.5 rounded-full', avatarColorClass)}
			{src}
			name1={avatarTitle || title}
		/>
	{/if}
	{title}
	{#if !hideRemove}
		<button
			type="button"
			class={cn(
				'inline-flex items-center rounded-xs bg-transparent p-0.5 text-sm',
				buttonColorClass
			)}
			aria-label="Remove"
			onclick={() => onRemove()}
		>
			<svg
				class="h-3 w-3"
				aria-hidden="true"
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				fill="none"
				viewBox="0 0 24 24"
				><path
					stroke="currentColor"
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M6 18 17.94 6M18 18 6.06 6"
				/></svg
			>
			<span class="sr-only">Remove</span>
		</button>
	{/if}
</span>
