<script lang="ts">
	import {
		Position,
		useSvelteFlow,
		type NodeProps,
		useStore,
		Handle,
		type Node,
		NodeToolbar,
		useUpdateNodeInternals
	} from '@xyflow/svelte';
	import { Plus, Trash2, Image as ImageIcon, X, ImageMinusIcon } from '@lucide/svelte';
	import type { WhatsappMessageData } from '$lib/schema/flow/index';
	import { Button } from '$lib/components/ui/button/index.js';
	import ImagePlusIcon from '@lucide/svelte/icons/image-plus';
	import RectangleEllipsisIcon from '@lucide/svelte/icons/rectangle-ellipsis';
	import CroppedImageUpload from '$lib/components/ui/image-upload/CroppedImageUpload.svelte';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { cn } from '$lib/utils.js';

	let { id, data }: NodeProps<Node<WhatsappMessageData, 'message'>> = $props();
	const { updateNodeData } = useSvelteFlow();
	const updateNodeInternals = useUpdateNodeInternals();

	// --- State Management ---
	// svelte-ignore state_referenced_locally
	let text = $state(data.text ?? 'Hello! Choose an option:');
	// svelte-ignore state_referenced_locally
	let buttons = $state(data.buttons ?? [{ id: 'btn-1', label: 'Option 1' }]);
	// svelte-ignore state_referenced_locally
	let imageUrl = $state(data.imageUrl ?? null);

	const { elementsSelectable, nodesDraggable, nodesConnectable } = useStore();
	const isDisabled = $derived(
		elementsSelectable === false || nodesDraggable === false || nodesConnectable === false
	);

	// Sync changes back to the Flow state
	$effect(() => {
		updateNodeData(id, { text, buttons, imageUrl });
		updateNodeInternals(id);
	});

	// --- Actions ---
	const addButton = () => {
		if (buttons.length < 3) {
			buttons = [...buttons, { id: crypto.randomUUID(), label: `New Button` }];
		}
	};

	const removeButton = (index: number) => {
		buttons = buttons.filter((_, i) => i !== index);
	};
</script>

<div class:pointer-events-none={isDisabled}>
	<NodeToolbar position={Position.Right}>
		<div class="flex flex-col gap-2">
			{#if !imageUrl}
				<Button
					variant="default"
					class="rounded-full"
					size="icon"
					title="Add image"
					onclick={() => {
						imageUrl =
							'https://fastly.picsum.photos/id/106/2592/1728.jpg?hmac=E1-3Hac5ffuCVwYwexdHImxbMFRsv83exZ2EhlYxkgY';
					}}><ImagePlusIcon /></Button
				>
			{:else}
				<Button
					variant="default"
					class="rounded-full"
					size="icon"
					title="Remove image"
					onclick={() => {
						imageUrl = null;
					}}><ImageMinusIcon size={14} /></Button
				>
			{/if}
			{#if buttons.length < 3}
				<Button
					variant="default"
					class="rounded-full"
					size="icon"
					onclick={addButton}
					title="Add button"><RectangleEllipsisIcon /></Button
				>
			{/if}
		</div>
	</NodeToolbar>
	<div class="relative w-[260px] font-sans drop-shadow-md">
		<Handle type="target" position={Position.Top} class="z-20 h-3! w-3!" />

		<div class="rounded-lg border border-[#b7e4ac] bg-[#d9fdd3]">
			{#if imageUrl}
				<CroppedImageUpload
					class="h-full w-full rounded-b-none p-0"
					fileUrl={imageUrl}
					onUpload={async (url) => {
						imageUrl = url;
					}}
				/>
			{/if}

			<Textarea
				bind:value={text}
				class={cn(
					'w-full resize-none border-none bg-transparent text-[14.5px] leading-relaxed text-[#111b21] outline-none',
					buttons.length > 0 && 'rounded-b-none',
					imageUrl && 'rounded-t-none'
				)}
				placeholder="Type message..."
			></Textarea>
			{#if buttons.length > 0}
				<div class="flex flex-col bg-white/50">
					{#each buttons as btn, i (btn.id)}
						<div class="group relative flex items-center border-t border-[#b7e4ac]">
							<input
								bind:value={btn.label}
								class="nodrag w-full bg-transparent p-2.5 text-center text-sm font-medium text-[#00a884] outline-none"
							/>

							<button
								class="nodrag absolute left-2 p-1 text-red-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-600"
								onclick={() => removeButton(i)}
							>
								<Trash2 size={14} />
							</button>

							<Handle type="source" id={btn.id} position={Position.Right} class="h-3! w-3!" />
						</div>
					{/each}
				</div>
			{:else}
				<Handle type="source" position={Position.Bottom} class="h-3! w-3!" />
			{/if}
		</div>
	</div>
</div>
