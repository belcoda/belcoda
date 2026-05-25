<script lang="ts">
	import {
		Position,
		useSvelteFlow,
		type NodeProps,
		Handle,
		type Node,
		useStore,
		useUpdateNodeInternals,
		NodeToolbar,
		useNodes
	} from '@xyflow/svelte';
	import type { TeamAddData } from '$lib/schema/flow/index';
	import { t } from '$lib/index.svelte';
	import { taint } from '$lib/components/flow/flow_state.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import TrashIcon from '@lucide/svelte/icons/trash';
	let { id, data }: NodeProps<Node<TeamAddData, 'teamAdd'>> = $props();
	const { updateNodeData } = useSvelteFlow();
	const updateNodeInternals = useUpdateNodeInternals();
	let teamId = $state((() => data.teamId)() ?? null);
	import TeamAddCombobox from './team_add/Combobox.svelte';
	const nodes = useNodes();
	const { elementsSelectable, nodesDraggable, nodesConnectable } = useStore();
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
			class="-mb-1 w-full border-b border-[#b7e4ac] bg-[#f8f9fa]/50 p-2 px-2 pt-2 text-[11px] font-medium text-[#008069] uppercase transition-colors hover:bg-white/50"
		>
			{t`Add to team:`}
		</div>
		<div class=" p-2">
			<TeamAddCombobox
				value={teamId}
				class="w-full"
				onSelectChange={(newTeamId) => {
					teamId = $state.snapshot(newTeamId);
					taint();
					updateNodeData(id, { teamId: $state.snapshot(newTeamId) });
					updateNodeInternals(id);
				}}
			/>
		</div>
	</div>
	<Handle type="source" position={Position.Bottom} class="h-3! w-3!" />
</div>
