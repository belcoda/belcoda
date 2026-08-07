<script lang="ts">
	/**
	 * Renders the text of a note. Every note body goes through here so parsing of mentions
	 * can be done in one place rather than being threaded through the note card's layout.
	 */

	type Props = {
		note: string;
		class?: string;
	};

	const { note, class: className }: Props = $props();
</script>

<div class="text-sm leading-relaxed whitespace-pre-wrap">
	{@html note}
</div>
