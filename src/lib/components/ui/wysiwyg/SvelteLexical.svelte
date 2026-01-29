<script lang="ts">
	import {
		BoldButton,
		Composer,
		ContentEditable,
		Divider,
		DropDownAlign,
		FontFamilyDropDown,
		FontSizeDropDown,
		ItalicButton,
		RichTextPlugin,
		StrikethroughButton,
		Toolbar,
		UnderlineButton
	} from 'svelte-lexical';
	import { theme } from 'svelte-lexical/dist/themes/default';

	const initialConfig = {
		theme,
		namespace: 'belcoda_wysiwyg',
		nodes: [],
		onError: (error: Error) => {
			throw error;
		}
	};
</script>

<Composer {initialConfig}>
	<div class="editor-shell svelte-lexical">
		<Toolbar>
			{#snippet children({ editor, activeEditor, blockType })}
				<FontFamilyDropDown />
				<FontSizeDropDown />
				<Divider />
				<BoldButton />
				<ItalicButton />
				<UnderlineButton />
				<StrikethroughButton />
				<Divider />
				<DropDownAlign />
			{/snippet}
		</Toolbar>

		<div class="editor-container">
			<div class="editor-scroller">
				<div class="editor">
					<ContentEditable />
				</div>
			</div>
			<RichTextPlugin />
		</div>
	</div>
</Composer>

<style>
	.editor-shell.svelte-lexical {
		margin: 0 auto !important;
	}
</style>
