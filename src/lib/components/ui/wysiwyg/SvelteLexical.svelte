<script lang="ts">
	import {
		BoldButton,
		Composer,
		ContentEditable,
		Divider,
		DropDownAlign,
		FontFamilyDropDown,
		FontSizeDropDown,
		LinkPlugin,
		ItalicButton,
		LinkNode,
		AutoLinkNode,
		AutoLinkPlugin,
		RichTextPlugin,
		InsertLink,
		FloatingLinkEditorPlugin,
		StrikethroughButton,
		Toolbar,
		UnderlineButton,
		OnChangePlugin,
		BlockFormatDropDown,
		HeadingDropDownItem,
		HeadingNode,
		ImagePlugin,
		ImageNode,
		InsertDropDown,
		InsertImageDropDownItem
	} from 'svelte-lexical';
	import InsertImageCombinedDialog from './InsertImageCombinedDialog.svelte';
	import { theme } from 'svelte-lexical/dist/themes/default';
	import type { EditorState } from 'lexical';
	import { structuredClone } from '$lib/utils/structuredClone';
	let {
		value = $bindable(null),
		onChange,
		disabled = false
	}: {
		value?: any;
		disabled?: boolean;
		onChange?: (state: any) => void;
	} = $props();

	let imageDialog: ReturnType<typeof InsertImageCombinedDialog> | undefined = $state(undefined);

	const initialConfig = {
		theme,
		namespace: 'belcoda_wysiwyg',
		nodes: [LinkNode, HeadingNode, ImageNode],
		editable: (() => !disabled)(),
		editorState: value ? JSON.stringify(value) : undefined,
		onError: (error: Error) => {
			throw error;
		}
	};

	let anchorElem = $state<HTMLElement | null>(null);

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
					<BlockFormatDropDown>
						<HeadingDropDownItem headingSize="h1" />
						<HeadingDropDownItem headingSize="h2" />
						<HeadingDropDownItem headingSize="h3" />
					</BlockFormatDropDown>
					<Divider />
					<BoldButton />
					<ItalicButton />
					<UnderlineButton />
					<StrikethroughButton />
					<Divider />
					<InsertLink />
					<Divider />
					<InsertDropDown>
						<InsertImageDropDownItem onclick={() => imageDialog?.show()} />
					</InsertDropDown>
					<Divider />
					<DropDownAlign />
					<InsertImageCombinedDialog bind:this={imageDialog} />
				{/snippet}
			</Toolbar>
		{/if}
		<div class="editor-container">
			<div class="editor-scroller group" bind:this={anchorElem}>
				<div class="editor group">
					<ContentEditable />
				</div>
			</div>
			<RichTextPlugin />
			<LinkPlugin />
			<ImagePlugin />
			<FloatingLinkEditorPlugin {anchorElem} />
			<OnChangePlugin
				onChange={handleChange}
				ignoreHistoryMergeTagChange={true}
				ignoreSelectionChange={true}
			/>
		</div>
	</div>
</Composer>

<style>
	.editor-shell,
	.svelte-lexical {
		margin: 0 auto !important;
	}

	.editor-container {
		position: relative;
	}
</style>
