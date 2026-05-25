<script lang="ts">
	import {
		Position,
		useSvelteFlow,
		type NodeProps,
		useStore,
		Handle,
		type Node,
		NodeToolbar,
		useNodes,
		useUpdateNodeInternals
	} from '@xyflow/svelte';
	import { taint } from '$lib/components/flow/flow_state.svelte';
	import type { WhatsappMessageData } from '$lib/schema/flow/index';
	import { Button } from '$lib/components/ui/button/index.js';
	import ImagePlusIcon from '@lucide/svelte/icons/image-plus';
	import ImageMinusIcon from '@lucide/svelte/icons/image-minus';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import RectangleEllipsisIcon from '@lucide/svelte/icons/rectangle-ellipsis';
	import CroppedImageUpload from '$lib/components/ui/image-upload/CroppedImageUpload.svelte';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { cn } from '$lib/utils.js';
	import TrashIcon from '@lucide/svelte/icons/trash';
	let { id, data }: NodeProps<Node<WhatsappMessageData, 'message'>> = $props();
	const { updateNodeData } = useSvelteFlow();

	// --- State Management ---
	let text = $state((() => data.text)() ?? 'Hello! Choose an option:');
	function getText() {
		return text ?? 'Hello! Choose an option:';
	}
	function setText(newText: string) {
		taint();
		text = newText;
		updateNodeData(id, { text });
	}
	let buttons = $state(
		((() => data.buttons)() ?? [{ id: 'btn-1', label: 'Option 1' }]).map((b) => ({ ...b }))
	);
	function getGetButtonTextFunction(index: number) {
		return () => buttons[index].label;
	}
	function getSetButtonTextFunction(index: number) {
		return (newText: string) => {
			taint();
			buttons[index].label = newText;
			updateNodeData(id, { buttons: $state.snapshot(buttons) });
		};
	}
	// svelte-ignore state_referenced_locally
	let imageUrl = $state(data.imageUrl ?? null);

	const { elementsSelectable, nodesDraggable, nodesConnectable } = useStore();
	const isDisabled = $derived(
		elementsSelectable === false || nodesDraggable === false || nodesConnectable === false
	);

	// Sync changes back to the Flow state
	/* $effect(() => {
		updateNodeData(id, { text, buttons, imageUrl });
		updateNodeInternals(id);
	}); */

	// --- Actions ---
	const addButton = () => {
		taint();
		if (buttons.length < 3) {
			buttons = [...buttons, { id: crypto.randomUUID(), label: `New Button` }];
		}
		updateNodeData(id, { buttons: $state.snapshot(buttons) });
	};

	const removeButton = (index: number) => {
		taint();
		buttons = buttons.filter((_, i) => i !== index);
		updateNodeData(id, { buttons: $state.snapshot(buttons) });
	};

	const nodes = useNodes();
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
						taint();
						imageUrl = null;
						updateNodeData(id, { imageUrl: null });
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
			<Button
				variant="outline"
				size="icon-sm"
				class="rounded-full"
				onclick={() => {
					//delete the node
					if (window.confirm('Are you sure you want to delete this node?')) {
						nodes.update((nodes) => nodes.filter((node) => node.id !== id));
					}
				}}
			>
				<TrashIcon />
			</Button>
		</div>
	</NodeToolbar>
	<div class="relative w-[260px] font-sans drop-shadow-md">
		<Handle
			type="target"
			position={Position.Top}
			class="z-20 h-3! w-3!"
			data-testid="flow-handle-target"
		/>

		<div class="rounded-lg border border-[#b7e4ac] bg-[#d9fdd3]">
			{#if imageUrl}
				<CroppedImageUpload
					class="h-full w-full rounded-b-none p-0"
					fileUrl={imageUrl}
					onUpload={async (url) => {
						taint();
						imageUrl = url;
						updateNodeData(id, { imageUrl: url });
					}}
				/>
			{/if}

			<Textarea
				bind:value={getText, setText}
				data-testid="flow-message-textarea"
				data-node-id={id}
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
								bind:value={getGetButtonTextFunction(i), getSetButtonTextFunction(i)}
								class="nodrag w-full bg-transparent p-2.5 text-center text-sm font-medium text-[#00a884] outline-none"
							/>

							<button
								class="nodrag absolute left-2 p-1 text-red-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-600"
								onclick={() => removeButton(i)}
							>
								<Trash2Icon size={14} />
							</button>

							<Handle
								type="source"
								id={btn.id}
								position={Position.Right}
								class="h-3! w-3!"
								data-testid="flow-handle-source"
							/>
						</div>
					{/each}
				</div>
			{:else}
				<Handle
					type="source"
					position={Position.Bottom}
					class="h-3! w-3!"
					data-testid="flow-handle-source"
				/>
			{/if}
		</div>
	</div>
</div>
