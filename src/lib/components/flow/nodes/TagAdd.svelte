<script lang="ts">
	import {
		Position,
		useSvelteFlow,
		type NodeProps,
		Handle,
		type Node,
		NodeToolbar,
		useStore,
		useNodes,
		useUpdateNodeInternals
	} from '@xyflow/svelte';
	import type { TagAddData } from '$lib/schema/flow/index';
	import { t } from '$lib/index.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import TrashIcon from '@lucide/svelte/icons/trash';
	import { taint } from '$lib/components/flow/flow_state.svelte';
	let { id, data }: NodeProps<Node<TagAddData, 'tagAdd'>> = $props();
	const { updateNodeData } = useSvelteFlow();
	const updateNodeInternals = useUpdateNodeInternals();
	let tagId = $state((() => data.tagId)() ?? null);
	import TagAddCombobox from './tag_add/Combobox.svelte';
	const { elementsSelectable, nodesDraggable, nodesConnectable } = useStore();
	const nodes = useNodes();
	const isDisabled = $derived(
		elementsSelectable === false || nodesDraggable === false || nodesConnectable === false
	);
</script>

<div class="relative w-[260px] font-sans drop-shadow-md" class:pointer-events-none={isDisabled}>
	<NodeToolbar position={Position.Right}>
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
	</NodeToolbar>

	<Handle type="target" position={Position.Top} class="z-20 h-3! w-3!" />

	<div class="rounded-lg border border-[#b7e4ac] bg-[#d9fdd3]">
		<div
			class="hover:bg-white/50m -mb-1 w-full border-b border-[#b7e4ac] bg-[#f8f9fa]/50 p-2 px-2 pt-2 text-[11px] font-medium text-[#008069] uppercase transition-colors"
		>
			{t`Add to tag:`}
		</div>
		<div class=" p-2">
			<TagAddCombobox
				value={tagId}
				class="w-full"
				onSelectChange={(tagId) => {
					taint();
					updateNodeData(id, { tagId });
					updateNodeInternals(id);
				}}
			/>
		</div>
	</div>
	<Handle type="source" position={Position.Bottom} class="h-3! w-3!" />
</div>
