<script lang="ts">
	import type { Component } from 'svelte';
	import { untrack } from 'svelte';
	import { Editor } from '@tiptap/core';
	import { StarterKit } from '@tiptap/starter-kit';
	import { TextStyle } from '@tiptap/extension-text-style';
	import { Color } from '@tiptap/extension-color';

	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { cn } from '$lib/utils.js';

	import BoldIcon from '@lucide/svelte/icons/bold';
	import ItalicIcon from '@lucide/svelte/icons/italic';
	import UnderlineIcon from '@lucide/svelte/icons/underline';
	import StrikethroughIcon from '@lucide/svelte/icons/strikethrough';
	import Heading1Icon from '@lucide/svelte/icons/heading-1';
	import Heading2Icon from '@lucide/svelte/icons/heading-2';
	import Heading3Icon from '@lucide/svelte/icons/heading-3';
	import ListIcon from '@lucide/svelte/icons/list';
	import ListOrderedIcon from '@lucide/svelte/icons/list-ordered';
	import PaletteIcon from '@lucide/svelte/icons/palette';
	import BanIcon from '@lucide/svelte/icons/ban';

	let { value = $bindable(''), class: className = undefined }: { value?: string; class?: string } =
		$props();

	let editorState = $state<{ editor: Editor | null }>({ editor: null });

	// Tracks the last HTML the editor produced so external `value` changes can be
	// told apart from the editor's own updates (prevents a setContent feedback loop).
	let lastHtml = value;

	const swatches = [
		{ name: 'Default', value: null },
		{ name: 'Slate', value: '#64748b' },
		{ name: 'Red', value: '#ef4444' },
		{ name: 'Orange', value: '#f97316' },
		{ name: 'Amber', value: '#f59e0b' },
		{ name: 'Green', value: '#22c55e' },
		{ name: 'Teal', value: '#14b8a6' },
		{ name: 'Blue', value: '#3b82f6' },
		{ name: 'Violet', value: '#8b5cf6' },
		{ name: 'Pink', value: '#ec4899' }
	];

	// Attachment: create the editor once the mount node is in the DOM, and tear
	// it down when the node is removed. `untrack` keeps the initial `value` read
	// from turning keystroke-driven `value` updates into editor re-creations.
	function mountEditor(node: HTMLElement) {
		const editor = new Editor({
			element: node,
			extensions: [StarterKit, TextStyle, Color],
			content: untrack(() => value),
			editorProps: {
				attributes: {
					// `prose` lives on the editable element itself (not a wrapper) so its
					// direct children are the content nodes — that lets Typography's
					// `> :first-child { margin-top: 0 }` reset actually reach the first
					// heading/paragraph and kill the gap at the top of the editor.
					class: 'prose prose-sm dark:prose-invert max-w-none min-h-36 px-3 py-2 focus:outline-none'
				}
			},
			onUpdate: ({ editor }) => {
				// Represent a blank document as '' (not '<p></p>') so callers that
				// treat empty content as null keep working after the markdown swap.
				lastHtml = editor.isEmpty ? '' : editor.getHTML();
				value = lastHtml;
			},
			// Reassign a fresh object on every transaction so the toolbar's
			// active states re-derive from the current editor selection.
			onTransaction: ({ editor }) => {
				editorState = { editor };
			}
		});
		editorState = { editor };

		return () => {
			editor.destroy();
			editorState = { editor: null };
		};
	}

	// Push external `value` changes back into the editor.
	$effect(() => {
		const html = value;
		const editor = editorState.editor;
		if (!editor) return;
		if (html === lastHtml) return;
		lastHtml = html;
		editor.commands.setContent(html, { emitUpdate: false });
	});

	const activeColor = $derived(
		(editorState.editor?.getAttributes('textStyle').color as string | undefined) ?? null
	);
</script>

{#snippet toolButton(icon: Component, label: string, active: boolean, run: () => void)}
	<Button
		type="button"
		variant={active ? 'secondary' : 'ghost'}
		size="icon-sm"
		aria-label={label}
		aria-pressed={active}
		title={label}
		onclick={run}
	>
		{@const Icon = icon}
		<Icon aria-hidden="true" />
	</Button>
{/snippet}

<div
	class={cn(
		'border-input focus-within:border-ring focus-within:ring-ring/50 rounded-md border shadow-xs transition-[color,box-shadow] focus-within:ring-[3px]',
		className
	)}
>
	{#if editorState.editor}
		{@const editor = editorState.editor}
		<div class="border-input flex flex-wrap items-center gap-0.5 border-b p-1">
			{@render toolButton(Heading1Icon, 'Heading 1', editor.isActive('heading', { level: 1 }), () =>
				editor.chain().focus().toggleHeading({ level: 1 }).run()
			)}
			{@render toolButton(Heading2Icon, 'Heading 2', editor.isActive('heading', { level: 2 }), () =>
				editor.chain().focus().toggleHeading({ level: 2 }).run()
			)}
			{@render toolButton(Heading3Icon, 'Heading 3', editor.isActive('heading', { level: 3 }), () =>
				editor.chain().focus().toggleHeading({ level: 3 }).run()
			)}

			<Separator orientation="vertical" class="mx-1 h-6" />

			{@render toolButton(BoldIcon, 'Bold', editor.isActive('bold'), () =>
				editor.chain().focus().toggleBold().run()
			)}
			{@render toolButton(ItalicIcon, 'Italic', editor.isActive('italic'), () =>
				editor.chain().focus().toggleItalic().run()
			)}
			{@render toolButton(UnderlineIcon, 'Underline', editor.isActive('underline'), () =>
				editor.chain().focus().toggleUnderline().run()
			)}
			{@render toolButton(StrikethroughIcon, 'Strikethrough', editor.isActive('strike'), () =>
				editor.chain().focus().toggleStrike().run()
			)}

			<Separator orientation="vertical" class="mx-1 h-6" />

			{@render toolButton(ListIcon, 'Bullet list', editor.isActive('bulletList'), () =>
				editor.chain().focus().toggleBulletList().run()
			)}
			{@render toolButton(ListOrderedIcon, 'Numbered list', editor.isActive('orderedList'), () =>
				editor.chain().focus().toggleOrderedList().run()
			)}

			<Separator orientation="vertical" class="mx-1 h-6" />

			<Popover.Root>
				<Popover.Trigger
					class={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}
					aria-label="Text color"
					title="Text color"
				>
					<PaletteIcon
						aria-hidden="true"
						style={activeColor ? `color: ${activeColor}` : undefined}
					/>
				</Popover.Trigger>
				<Popover.Content align="start" class="w-auto p-2">
					<div class="grid grid-cols-5 gap-1">
						{#each swatches as swatch (swatch.name)}
							<button
								type="button"
								title={swatch.name}
								aria-label={swatch.name}
								class={cn(
									'border-border flex size-6 items-center justify-center rounded-md border transition-shadow',
									activeColor === swatch.value &&
										'ring-ring ring-offset-background ring-2 ring-offset-1'
								)}
								style={swatch.value ? `background-color: ${swatch.value}` : undefined}
								onclick={() => {
									if (swatch.value) editor.chain().focus().setColor(swatch.value).run();
									else editor.chain().focus().unsetColor().run();
								}}
							>
								{#if !swatch.value}
									<BanIcon class="text-muted-foreground size-3.5" aria-hidden="true" />
								{/if}
							</button>
						{/each}
					</div>
				</Popover.Content>
			</Popover.Root>
		</div>
	{/if}

	<!-- TipTap mounts its editable `.ProseMirror` element inside here; the prose
	     styling + padding are applied to that element via `editorProps` above. -->
	<div {@attach mountEditor}></div>
</div>
