<script lang="ts">
	type Props = {
		onEmojiSelect: (emoji: string | null) => void;
		hideIfSelected: boolean;
		selectedEmoji: string | null | undefined;
		class?: string;
		onTapSelectedEmojiBehaviour?: 'remove' | 'select';
	};
	import { Popover } from 'bits-ui';
	import { Picker } from 'emoji-mart';
	let {
		onEmojiSelect,
		hideIfSelected,
		class: className,
		onTapSelectedEmojiBehaviour = 'select',
		selectedEmoji
	}: Props = $props();
	import data from '@emoji-mart/data';
	function mountPicker() {
		const picker = new Picker({
			data: data,
			theme: 'light',
			onEmojiSelect: ({ native }: { native: string }) => {
				onEmojiSelect(native);
				selectedEmoji = native;
				open = false;
			}
		});
		const el = document.getElementById(id);
		if (el) {
			el.appendChild(picker as unknown as Node);
		}
	}
	import { tick } from 'svelte';

	import { v4 as uuidv4 } from 'uuid';
	const id = uuidv4();
	import SmileIcon from '@lucide/svelte/icons/smile';
	import { cn } from '$lib/utils';

	let open = $state(false);
	function getOpen() {
		return open;
	}

	function setOpen(value: boolean) {
		if (value === true) {
			open = true;
		}
		if (value === false) {
			open = false;
		}
	}
</script>

{#if !hideIfSelected || !selectedEmoji}
	<Popover.Root
		bind:open={getOpen, setOpen}
		onOpenChange={(status) => {
			if (status === true) {
				tick().then(() => {
					mountPicker();
				});
			}
		}}
	>
		<Popover.Trigger class={cn('flex h-5 w-6 items-center justify-center', className)}>
			<button
				type="button"
				onclick={() => {
					if (onTapSelectedEmojiBehaviour === 'remove') {
						selectedEmoji = null;
						onEmojiSelect(null);
					}
				}}
			>
				{#if selectedEmoji}
					<div class="size-6">
						{selectedEmoji}
					</div>
				{:else}
					<SmileIcon class="size-4" />
				{/if}
			</button>
		</Popover.Trigger>
		<Popover.Portal>
			<Popover.Content>
				<div class="h-full w-full text-4xl" {id}>&nbsp;</div>
			</Popover.Content>
		</Popover.Portal>
	</Popover.Root>
{/if}
