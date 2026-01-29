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
		UnderlineButton,
		OnChangePlugin
	} from 'svelte-lexical';
	import { theme } from 'svelte-lexical/dist/themes/default';
	import type { EditorState } from 'lexical';

	let {
		value = $bindable(null),
		onChange
	}: {
		value?: any;
		onChange?: (state: any) => void;
	} = $props();

	const initialConfig = {
		theme,
		namespace: 'belcoda_wysiwyg',
		nodes: [],
		editorState: value ? JSON.stringify(value) : undefined,
		onError: (error: Error) => {
			throw error;
		}
	};

	function handleChange(editorState: EditorState) {
		const state = structuredClone(editorState.toJSON());
		value = state;
		onChange?.(state);
	}
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
			<OnChangePlugin onChange={handleChange} ignoreHistoryMergeTagChange={true} ignoreSelectionChange={true} />
		</div>
	</div>
</Composer>

<style>
	.editor-shell.svelte-lexical {
		margin: 0 auto !important;
	}
</style>
