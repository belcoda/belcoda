<script lang="ts">
	import { cn } from '$lib/utils';
	import type { EmojiReaction } from '$lib/schema/whatsapp/message';

	type Props = {
		reactions: EmojiReaction[];
		class?: string;
	};
	const { reactions, class: className = '' }: Props = $props();

	// Group reactions by emoji and count them
	const reactionCounts = $derived.by(() => {
		const counts = new Map<string, number>();
		reactions.forEach((reaction) => {
			if (reaction.emoji) {
				counts.set(reaction.emoji, (counts.get(reaction.emoji) || 0) + 1);
			}
		});
		return Array.from(counts.entries()).map(([emoji, count]) => ({ emoji, count }));
	});
</script>

{#if reactionCounts.length > 0}
	<div
		class={cn(
			'absolute -bottom-3 mx-2 flex justify-center gap-0.5 rounded-full bg-white px-1.5 py-0.5 text-xs shadow-sm',
			className
		)}
	>
		{#each reactionCounts.slice(0, 2) as { emoji, count }}
			<div class="flex items-center gap-0.5">
				<span>{emoji}</span>
				{#if count > 1}
					<span class="text-[10px] text-gray-600">{count}</span>
				{/if}
			</div>
		{/each}
		{#if reactionCounts.length > 2}
			<div class="flex items-center text-[10px] text-gray-600">
				+{reactionCounts.length - 2}
			</div>
		{/if}
	</div>
{/if}
