<script lang="ts">
	/**
	 * Renders the text of a note. Every note body goes through here so parsing of mentions
	 * can be done in one place rather than being threaded through the note card's layout.
	 */
	import { escapeHtml } from '$lib/utils/escape-html';

	type Props = {
		note: string;
		class?: string;
	};

	const { note, class: className }: Props = $props();

	const safeNote = $derived(escapeHtml(note));
</script>

<div class="text-sm leading-relaxed whitespace-pre-wrap {className ?? ''}">
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- safeNote is escaped above -->
	{@html safeNote}
</div>
