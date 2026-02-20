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
		RichTextPlugin,
		InsertLink,
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
		value?: unknown;
		disabled?: boolean;
		onChange?: (state: unknown) => void;
	} = $props();

	const EMPTY_EDITOR_FINGERPRINT = '__belcoda_lexical_empty__';

	function toEditorStateJson(state: unknown): string | undefined {
		if (state === null || state === undefined) return undefined;
		try {
			return JSON.stringify(state);
		} catch {
			return undefined;
		}
	}

	function getEditorStateFingerprint(state: unknown): string {
		return toEditorStateJson(state) ?? EMPTY_EDITOR_FINGERPRINT;
	}

	let composerKey = $state(0);
	let initialEditorState = $state<string | undefined>(toEditorStateJson(value));
	let lastAppliedFingerprint = $state(getEditorStateFingerprint(value));

	$effect(() => {
		const nextFingerprint = getEditorStateFingerprint(value);
		if (nextFingerprint === lastAppliedFingerprint) return;

		initialEditorState = toEditorStateJson(value);
		lastAppliedFingerprint = nextFingerprint;
		composerKey += 1;
	});

	const initialConfig = $derived.by(() => ({
		theme,
		namespace: 'belcoda_wysiwyg',
		nodes: [LinkNode],
		editable: !disabled,
		editorState: initialEditorState,
		onError: (error: Error) => {
			throw error;
		}
	}));

	function handleChange(editorState: EditorState) {
		const state = structuredClone(editorState.toJSON());
		lastAppliedFingerprint = getEditorStateFingerprint(state);
		value = state;
		onChange?.(state);
	}
</script>

{#key composerKey}
	<Composer {initialConfig}>
		<div
			class="editor-shell svelte-lexical focus-within:rounded-lg focus-within:border focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50"
		>
			{#if !disabled}
				<Toolbar>
					<FontFamilyDropDown />
					<FontSizeDropDown />
					<Divider />
					<BoldButton />
					<ItalicButton />
					<UnderlineButton />
					<StrikethroughButton />
					<Divider />
					<InsertLink />
					<Divider />
					<DropDownAlign />
				</Toolbar>
			{/if}
			<div class="editor-container">
				<div class="editor-scroller group">
					<div class="editor group">
						<ContentEditable />
					</div>
				</div>
				<RichTextPlugin />
				<LinkPlugin />
				<OnChangePlugin
					onChange={handleChange}
					ignoreHistoryMergeTagChange={true}
					ignoreSelectionChange={true}
				/>
			</div>
		</div>
	</Composer>
{/key}

<style>
	.editor-shell.svelte-lexical {
		margin: 0 auto !important;
	}
</style>
