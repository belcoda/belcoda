<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs';
	import { t } from '$lib/index.svelte';
	import { watch } from 'runed';
	import LockIcon from '@lucide/svelte/icons/lock';
	import MessageSquareIcon from '@lucide/svelte/icons/message-square';
	import StickyNoteIcon from '@lucide/svelte/icons/sticky-note';
	import SendBusinessApiIndividualMessage from '$lib/components/widgets/communications/send_wa_msg/SendBusinessApiIndividualMessage.svelte';
	import SendBusinessApiTemplateMessage from '$lib/components/widgets/communications/send_wa_msg/BusinessApiTemplateMessageFrame.svelte';
	import NoteComposer from '$lib/components/widgets/notes/NoteComposer.svelte';

	type ComposerMode = 'message' | 'note';

	type Props = {
		personId: string;
		personDisplayName?: string;
		whatsappConfigured: boolean;
		whatsappWindowOpen: boolean;
	};

	const { personId, personDisplayName, whatsappConfigured, whatsappWindowOpen }: Props = $props();

	let mode = $state<ComposerMode>('message');
	let footerElement = $state<HTMLElement | null>(null);

	// Without WhatsApp there is nothing to send, so the switch is hidden and notes are the
	// only thing this composer does.
	const showModeSwitch = $derived(whatsappConfigured);
	const noteMode = $derived(mode === 'note' || !whatsappConfigured);

	// Never carry a mode across conversations: landing on a new person always starts in
	// message mode, so a note-mode session can't follow you to someone else's timeline.
	watch(
		() => personId,
		() => {
			mode = 'message';
		}
	);

	function handleWindowKeydown(event: KeyboardEvent) {
		if (!showModeSwitch) return;

		if (event.key.toLowerCase() === 'n' && event.shiftKey && (event.metaKey || event.ctrlKey)) {
			event.preventDefault();
			mode = 'note';
			return;
		}

		// Esc leaves note mode, but only from inside the composer and only from an empty
		// field. otherwise it would throw away whatever the user had typed.
		if (event.key === 'Escape' && noteMode) {
			const target = event.target;
			if (!(target instanceof Node) || !footerElement?.contains(target)) return;
			if (target instanceof HTMLTextAreaElement && target.value.length > 0) return;
			mode = 'message';
		}
	}
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<footer
	class="flex shrink-0 flex-col gap-2 border-t p-4 {noteMode
		? 'border-t-2 border-t-amber-500 bg-amber-50/60'
		: 'bg-background'}"
	bind:this={footerElement}
	data-testid="conversation-composer"
	data-mode={noteMode ? 'note' : 'message'}
>
	{#if showModeSwitch}
		<div class="flex flex-wrap items-center gap-x-3 gap-y-1">
			<Tabs.Root bind:value={() => mode, (value) => (mode = value as ComposerMode)}>
				<Tabs.List class={noteMode ? 'bg-amber-100' : undefined}>
					<Tabs.Trigger value="message" data-testid="composer-mode-message">
						<MessageSquareIcon />
						{t`Message`}
					</Tabs.Trigger>
					<Tabs.Trigger
						value="note"
						data-testid="composer-mode-note"
						class="data-[state=active]:bg-amber-600 data-[state=active]:text-white"
					>
						<StickyNoteIcon />
						{t`Note`}
					</Tabs.Trigger>
				</Tabs.List>
			</Tabs.Root>

			{#if noteMode}
				<p class="flex items-center gap-1.5 text-sm font-medium text-amber-800">
					<LockIcon class="size-3.5" />
					{#if personDisplayName}
						{t`Internal note — ${personDisplayName} will not see this`}
					{:else}
						{t`Internal note — the person will not see this`}
					{/if}
				</p>
			{/if}
		</div>
	{:else}
		<p class="text-sm text-muted-foreground">
			{t`WhatsApp is not onboarded for this organization. Please create a WhatsApp Business Account in settings.`}
		</p>
	{/if}

	{#if noteMode}
		<NoteComposer {personId} {personDisplayName} />
	{:else if whatsappWindowOpen}
		<SendBusinessApiIndividualMessage {personId} />
	{:else}
		<SendBusinessApiTemplateMessage {personId} />
	{/if}
</footer>
