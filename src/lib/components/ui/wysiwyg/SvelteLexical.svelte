<script lang="ts">
	import { RichTextComposer } from 'svelte-lexical';
	import { theme } from 'svelte-lexical/dist/themes/default';
	import type { SerializedEditorState, SerializedLexicalNode } from 'lexical';

	let composer: RichTextComposer;
</script>

<RichTextComposer {theme} bind:this={composer} />
