<script lang="ts">
	import {
		Position,
		useSvelteFlow,
		type NodeProps,
		Handle,
		type Node,
		useStore,
		useUpdateNodeInternals
	} from '@xyflow/svelte';
	import type { TeamAddData } from '$lib/schema/flow/index';
	let { id, data }: NodeProps<Node<TeamAddData, 'teamAdd'>> = $props();
	const { updateNodeData } = useSvelteFlow();
	const updateNodeInternals = useUpdateNodeInternals();
	/*svelte-ignore state_referenced_locally */
	let teamId = $state(data.teamId ?? null);
	$effect(() => {
		updateNodeData(id, { teamId });
		updateNodeInternals(id);
	});
	import TeamAddCombobox from './team_add/Combobox.svelte';
	const { elementsSelectable, nodesDraggable, nodesConnectable } = useStore();
	const isDisabled = $derived(
		elementsSelectable === false || nodesDraggable === false || nodesConnectable === false
	);
</script>

<div class="relative w-[260px] font-sans drop-shadow-md" class:pointer-events-none={isDisabled}>
	<Handle type="target" position={Position.Top} class="z-20 h-3! w-3!" />

	<div class="rounded-lg border border-[#b7e4ac] bg-[#d9fdd3]">
		<div
			class="hover:bg-white/50m -mb-1 w-full border-b border-[#b7e4ac] bg-[#f8f9fa]/50 p-2 px-2 pt-2 text-[11px] font-medium text-[#008069] uppercase transition-colors"
		>
			Add to team:
		</div>
		<div class=" p-2">
			<TeamAddCombobox
				value={teamId}
				class="w-full"
				onSelectChange={(teamId) => {
					updateNodeData(id, { teamId });
					updateNodeInternals(id);
				}}
			/>
		</div>
	</div>
	<Handle type="source" position={Position.Bottom} class="h-3! w-3!" />
</div>
