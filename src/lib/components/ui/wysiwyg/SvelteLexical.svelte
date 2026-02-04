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
		onChange,
		disabled = false
	}: {
		value?: any;
		disabled?: boolean;
		onChange?: (state: any) => void;
	} = $props();

	const initialConfig = {
		theme,
		namespace: 'belcoda_wysiwyg',
		nodes: [],
		editable: !disabled,
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
	<div
		class="editor-shell svelte-lexical focus-within:rounded-lg focus-within:border focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50"
	>
		{#if !disabled}
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
		{/if}
		<div class="editor-container">
			<div class="editor-scroller group">
				<div class="editor group">
					<ContentEditable />
				</div>
			</div>
			<RichTextPlugin />
			<OnChangePlugin
				onChange={handleChange}
				ignoreHistoryMergeTagChange={true}
				ignoreSelectionChange={true}
			/>
		</div>
	</div>
</Composer>

<style>
	.editor-shell.svelte-lexical {
		margin: 0 auto !important;
	}
</style>
