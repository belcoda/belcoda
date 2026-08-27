<script lang="ts">
	import type { Component } from 'svelte';
	import { untrack } from 'svelte';
	import { Editor } from '@tiptap/core';
	import { StarterKit } from '@tiptap/starter-kit';
	import { TextStyle } from '@tiptap/extension-text-style';
	import { Color } from '@tiptap/extension-color';
	import { Image } from '@tiptap/extension-image';

	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import ImageUpload from '$lib/components/ui/file-upload/ImageUpload.svelte';
	import { templateFragments, type TemplateFragmentHelper } from '$lib/utils/string/handlebars';
	import { cn } from '$lib/utils.js';
	import { t } from '$lib/index.svelte';
	import { appState } from '$lib/state.svelte';

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
	import ImageIcon from '@lucide/svelte/icons/image';
	import BracesIcon from '@lucide/svelte/icons/braces';

	let {
		value = $bindable(''),
		organizationId,
		class: className = undefined
	}: {
		value?: string;
		/** Owner of uploaded images. Falls back to the active app organization. */
		organizationId?: string;
		class?: string;
	} = $props();

	// The image uploader needs an organization to scope uploads to. Prefer an
	// explicit prop, otherwise use the active app org (null-safe: hides the
	// image button when there is no org context rather than throwing).
	const resolvedOrganizationId = $derived(organizationId ?? appState.optionalOrganizationId);

	// Max size for editor image uploads. Enforced client-side before upload
	// (the Tigris client-upload handshake exposes no server-side size hook).
	const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

	let editorState = $state<{ editor: Editor | null }>({ editor: null });

	// Tracks the last HTML the editor produced so external `value` changes can be
	// told apart from the editor's own updates (prevents a setContent feedback loop).
	let lastHtml = value;

	const swatches = $derived([
		{ name: t`Default`, value: null },
		{ name: t`Slate`, value: '#64748b' },
		{ name: t`Red`, value: '#ef4444' },
		{ name: t`Orange`, value: '#f97316' },
		{ name: t`Amber`, value: '#f59e0b' },
		{ name: t`Green`, value: '#22c55e' },
		{ name: t`Teal`, value: '#14b8a6' },
		{ name: t`Blue`, value: '#3b82f6' },
		{ name: t`Violet`, value: '#8b5cf6' },
		{ name: t`Pink`, value: '#ec4899' }
	]);

	// Attachment: create the editor once the mount node is in the DOM, and tear
	// it down when the node is removed. `untrack` keeps the initial `value` read
	// from turning keystroke-driven `value` updates into editor re-creations.
	function mountEditor(node: HTMLElement) {
		const editor = new Editor({
			element: node,
			extensions: [StarterKit, TextStyle, Color, Image],
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

	// Synchronise external `value` changes into the editor. This is the one
	// legitimate use of `$effect` here: ProseMirror is a non-reactive external
	// system, so a controlled `value` prop can only be pushed in imperatively.
	// The `lastHtml` guard skips the editor's own updates to avoid a feedback loop.
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

	// Image upload popover. <ImageUpload> reports a finished upload via its
	// `onUpload` callback; we insert the image at the current selection and
	// close the popover.
	let imagePopoverOpen = $state(false);

	function insertImage(src: string) {
		editorState.editor?.chain().focus().setImage({ src }).run();
		imagePopoverOpen = false;
	}

	// "Insert fragment" dialog. Fragments are handlebars helpers (see
	// utils/string/handlebars.ts) that get merged per-recipient at send time.
	// The author picks a fragment and optional backup text, and we insert the
	// raw `{{helper 'backup'}}` token at the cursor.
	let fragmentDialogOpen = $state(false);
	let selectedFragment = $state('');
	let fragmentFallback = $state('');

	// Human-readable label per helper. Typed by the helper union so adding a new
	// fragment to handlebars.ts forces a label to be added here too.
	const fragmentLabels = $derived<Record<TemplateFragmentHelper, string>>({
		givenName: t`First name`,
		familyName: t`Last name`,
		email: t`Email address`,
		phone: t`Phone number`,
		organizationName: t`Organization name`,
		organizationSlug: t`Organization slug`
	});

	const fragmentOptions = $derived(
		templateFragments.map(({ helper }) => ({ value: helper, label: fragmentLabels[helper] }))
	);

	const selectedFragmentLabel = $derived(
		fragmentOptions.find((option) => option.value === selectedFragment)?.label ?? ''
	);

	// Build the handlebars token. Backup text is wrapped in a single-quoted
	// string literal, so any single quotes inside it are escaped so they don't
	// terminate the literal early.
	function buildFragment(helper: string, fallback: string): string {
		const backup = fallback.trim();
		return backup ? `{{${helper} '${backup.replace(/'/g, "\\'")}'}}` : `{{${helper}}}`;
	}

	const fragmentPreview = $derived(
		selectedFragment ? buildFragment(selectedFragment, fragmentFallback) : ''
	);

	function insertFragment() {
		const editor = editorState.editor;
		if (!editor || !selectedFragment) return;
		// Insert as a plain text node (not parsed HTML) so characters like `<` or
		// `&` in the backup text stay literal instead of being read as markup.
		editor
			.chain()
			.focus()
			.insertContent({ type: 'text', text: buildFragment(selectedFragment, fragmentFallback) })
			.run();
		fragmentDialogOpen = false;
		selectedFragment = '';
		fragmentFallback = '';
	}
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
			{@render toolButton(
				Heading1Icon,
				t`Heading 1`,
				editor.isActive('heading', { level: 1 }),
				() => editor.chain().focus().toggleHeading({ level: 1 }).run()
			)}
			{@render toolButton(
				Heading2Icon,
				t`Heading 2`,
				editor.isActive('heading', { level: 2 }),
				() => editor.chain().focus().toggleHeading({ level: 2 }).run()
			)}
			{@render toolButton(
				Heading3Icon,
				t`Heading 3`,
				editor.isActive('heading', { level: 3 }),
				() => editor.chain().focus().toggleHeading({ level: 3 }).run()
			)}

			<Separator orientation="vertical" class="mx-1 h-6" />

			{@render toolButton(BoldIcon, t`Bold`, editor.isActive('bold'), () =>
				editor.chain().focus().toggleBold().run()
			)}
			{@render toolButton(ItalicIcon, t`Italic`, editor.isActive('italic'), () =>
				editor.chain().focus().toggleItalic().run()
			)}
			{@render toolButton(UnderlineIcon, t`Underline`, editor.isActive('underline'), () =>
				editor.chain().focus().toggleUnderline().run()
			)}
			{@render toolButton(StrikethroughIcon, t`Strikethrough`, editor.isActive('strike'), () =>
				editor.chain().focus().toggleStrike().run()
			)}

			<Separator orientation="vertical" class="mx-1 h-6" />

			{@render toolButton(ListIcon, t`Bullet list`, editor.isActive('bulletList'), () =>
				editor.chain().focus().toggleBulletList().run()
			)}
			{@render toolButton(ListOrderedIcon, t`Numbered list`, editor.isActive('orderedList'), () =>
				editor.chain().focus().toggleOrderedList().run()
			)}

			<Separator orientation="vertical" class="mx-1 h-6" />

			<Popover.Root>
				<Popover.Trigger
					class={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}
					aria-label={t`Text color`}
					title={t`Text color`}
				>
					<PaletteIcon
						aria-hidden="true"
						style={activeColor ? `color: ${activeColor}` : undefined}
					/>
				</Popover.Trigger>
				<Popover.Content align="start" class="w-auto p-2">
					<div class="grid grid-cols-5 gap-1">
						{#each swatches as swatch (swatch.value ?? 'default')}
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

			<Separator orientation="vertical" class="mx-1 h-6" />

			<Dialog.Root bind:open={fragmentDialogOpen}>
				<Dialog.Trigger>
					{#snippet child({ props })}
						<Button
							type="button"
							{...props}
							variant="ghost"
							size="icon-sm"
							aria-label={t`Insert fragment`}
							title={t`Insert fragment`}
						>
							<BracesIcon aria-hidden="true" />
						</Button>
					{/snippet}
				</Dialog.Trigger>
				<Dialog.Content class="sm:max-w-[425px]">
					<Dialog.Header>
						<Dialog.Title>{t`Insert fragment`}</Dialog.Title>
						<Dialog.Description>
							{t`Insert a placeholder that fills in with each recipient's details. The backup text is used when that detail is missing.`}
						</Dialog.Description>
					</Dialog.Header>
					<div class="grid gap-4 py-2">
						<div class="grid gap-2">
							<Label for="fragment-type">{t`Fragment`}</Label>
							<Select.Root type="single" bind:value={selectedFragment}>
								<Select.Trigger id="fragment-type" class="w-full justify-between font-medium">
									{selectedFragmentLabel || t`Select a fragment`}
								</Select.Trigger>
								<Select.Content>
									{#each fragmentOptions as option (option.value)}
										<Select.Item value={option.value} label={option.label} />
									{/each}
								</Select.Content>
							</Select.Root>
						</div>
						<div class="grid gap-2">
							<Label for="fragment-fallback">{t`Backup text`}</Label>
							<Input
								id="fragment-fallback"
								bind:value={fragmentFallback}
								placeholder={t`e.g. friend`}
							/>
						</div>
						{#if fragmentPreview}
							<p class="text-muted-foreground text-sm">
								{t`Preview`}: <code class="font-mono">{fragmentPreview}</code>
							</p>
						{/if}
					</div>
					<Dialog.Footer>
						<Dialog.Close class={cn(buttonVariants({ variant: 'outline' }))}>
							{t`Cancel`}
						</Dialog.Close>
						<Button type="button" disabled={!selectedFragment} onclick={insertFragment}>
							{t`Insert`}
						</Button>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Root>

			{#if resolvedOrganizationId}
				<Separator orientation="vertical" class="mx-1 h-6" />

				<Popover.Root bind:open={imagePopoverOpen}>
					<Popover.Trigger
						class={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}
						aria-label={t`Insert image`}
						title={t`Insert image`}
					>
						<ImageIcon aria-hidden="true" />
					</Popover.Trigger>
					<Popover.Content align="start" class="w-72 p-2">
						<ImageUpload
							organizationId={resolvedOrganizationId}
							maxSizeBytes={MAX_IMAGE_UPLOAD_BYTES}
							onUpload={insertImage}
						/>
					</Popover.Content>
				</Popover.Root>
			{/if}
		</div>
	{/if}

	<!-- TipTap mounts its editable `.ProseMirror` element inside here; the prose
	     styling + padding are applied to that element via `editorProps` above. -->
	<div {@attach mountEditor}></div>
</div>
