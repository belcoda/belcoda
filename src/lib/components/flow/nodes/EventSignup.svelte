<script lang="ts">
	import {
		Position,
		useSvelteFlow,
		type NodeProps,
		Handle,
		type Node,
		useStore,
		useUpdateNodeInternals,
		NodeToolbar
	} from '@xyflow/svelte';
	import type { EventSignupData } from '$lib/schema/flow/index';
	import { t } from '$lib/index.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import TrashIcon from '@lucide/svelte/icons/trash';
	let { id, data }: NodeProps<Node<EventSignupData, 'eventSignup'>> = $props();
	const { updateNodeData, deleteElements } = useSvelteFlow();
	const updateNodeInternals = useUpdateNodeInternals();
	import { taint } from '$lib/components/flow/flow_state.svelte';
	import { deleteFlowNode } from '$lib/components/flow/deleteFlowNode';
	let eventId = $state((() => data.eventId)() ?? null);

	import EventSignupCombobox from './event_signup/Combobox.svelte';
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
			onclick={() => deleteFlowNode(deleteElements, id)}
		>
			<TrashIcon />
		</Button>
	</NodeToolbar>

	<Handle type="target" position={Position.Top} class="z-20 h-3! w-3!" />

	<div class="rounded-lg border border-[#b7e4ac] bg-[#d9fdd3]">
		<div
			class="hover:bg-white/50m -mb-1 w-full border-b border-[#b7e4ac] bg-[#f8f9fa]/50 p-2 px-2 pt-2 text-[11px] font-medium text-[#008069] uppercase transition-colors"
		>
			{t`Add to event:`}
		</div>
		<div class=" p-2">
			<EventSignupCombobox
				value={eventId}
				class="w-full"
				onSelectChange={(newEventId) => {
					eventId = $state.snapshot(newEventId);
					taint();
					updateNodeData(id, { eventId: $state.snapshot(newEventId) });
					updateNodeInternals(id);
				}}
			/>
		</div>
	</div>
	<Handle type="source" position={Position.Bottom} class="h-3! w-3!" />
</div>
