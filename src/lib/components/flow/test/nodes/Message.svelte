<script lang="ts">
	import {
		Position,
		useSvelteFlow,
		type NodeProps,
		Handle,
		useUpdateNodeInternals
	} from '@xyflow/svelte';
	import { Plus, Trash2, Image as ImageIcon, X } from '@lucide/svelte';
	import type { WhatsAppNodeData } from '../types';

	let { id, data }: NodeProps<WhatsAppNodeData> = $props();
	const { updateNodeData } = useSvelteFlow();
	const updateNodeInternals = useUpdateNodeInternals();

	// --- State Management ---
	let text = $state(data.text ?? 'Hello! Choose an option:');
	let buttons = $state(data.buttons ?? [{ id: 'btn-1', label: 'Option 1' }]);
	let imageUrl = $state(data.imageUrl ?? null);

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

<div class="relative w-[260px] font-sans drop-shadow-md">
	<Handle type="target" position={Position.Top} class="z-20 h-3! w-3!" />

	<div class="rounded-lg border border-[#b7e4ac] bg-[#d9fdd3]">
		{#if imageUrl}
			<div class="group relative flex h-32 items-center justify-center rounded-t-lg bg-[#c0e8b6]">
				<img src={imageUrl} alt="Header" class="h-full w-full rounded-t-lg object-cover" />
				<button
					onclick={() => (imageUrl = null)}
					class="nodrag absolute top-1 right-1 rounded-full bg-black/20 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/40"
				>
					<X size={14} />
				</button>
			</div>
		{:else}
			<button
				onclick={() => (imageUrl = 'https://picsum.photos/seed/wa/400/200')}
				class="nodrag w-full border-b border-[#b7e4ac] bg-[#f8f9fa]/50 p-2 text-[11px] font-medium text-[#008069] transition-colors hover:bg-white/50"
			>
				+ ADD IMAGE HEADER
			</button>
		{/if}

		<div class="p-3">
			<textarea
				bind:value={text}
				class="nodrag w-full resize-none border-none bg-transparent text-[14.5px] leading-relaxed text-[#111b21] outline-none"
				rows="2"
				placeholder="Type message..."
			></textarea>
		</div>

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

			{#if buttons.length < 3}
				<button
					class="nodrag flex items-center justify-center gap-1 border-t border-[#b7e4ac] bg-white/30 p-2 text-xs text-gray-500 transition-colors hover:text-[#008069]"
					onclick={addButton}
				>
					<Plus size={14} /> Add Button
				</button>
			{/if}
		</div>
	</div>
</div>
