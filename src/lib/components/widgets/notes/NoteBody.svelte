<script lang="ts">
	import type { ReadPersonNoteMentionZero } from '$lib/schema/person-note-mention';
	import { splitNoteByMentions } from '$lib/utils/person-note/mentions';

	type Props = {
		note: string;
		mentions?: readonly ReadPersonNoteMentionZero[];
		class?: string;
		testId?: string;
	};

	const { note, mentions = [], class: className, testId }: Props = $props();

	const segments = $derived(splitNoteByMentions(note, mentions));
</script>

<div class="text-sm leading-relaxed whitespace-pre-wrap {className ?? ''}" data-testid={testId}>
	{#each segments as segment}
		{#if segment.isMention}
			<strong class="font-semibold" data-note-mention>{segment.text}</strong>
		{:else}
			{segment.text}
		{/if}
	{/each}
</div>
