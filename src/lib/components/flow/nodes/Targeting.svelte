<script lang="ts">
	import {
		Position,
		useSvelteFlow,
		type NodeProps,
		Handle,
		useUpdateNodeInternals,
		type Node,
		useStore
	} from '@xyflow/svelte';
	import { defaultFilterGroup } from '$lib/schema/person/filter';
	import type { TargetingData } from '$lib/schema/flow/index';
	let { id, data }: NodeProps<Node<TargetingData, 'targeting'>> = $props();
	const { updateNodeData } = useSvelteFlow();
	const updateNodeInternals = useUpdateNodeInternals();
	/*svelte-ignore state_referenced_locally */
	let filter = $state((() => structuredClone(data.filter))() || defaultFilterGroup);
	$effect(() => {
		updateNodeData(id, { filter });
		updateNodeInternals(id);
	});

	import RecipientBox from '$lib/components/widgets/communications/recipients/RecipientBox.svelte';
	const { elementsSelectable, nodesDraggable, nodesConnectable } = useStore();
	const isDisabled = $derived(
		elementsSelectable === false || nodesDraggable === false || nodesConnectable === false
	);
</script>

<div class="relative w-[460px] font-sans drop-shadow-md" class:pointer-events-none={isDisabled}>
	<div class="rounded-lg border border-[#b7e4ac] bg-[#d9fdd3]">
		<div
			class="hover:bg-white/50m -mb-1 w-full border-b border-[#b7e4ac] bg-[#f8f9fa]/50 p-2 px-2 pt-2 text-[11px] font-medium text-[#008069] uppercase transition-colors"
		>
			Recipients:
		</div>
		<div class=" p-2">
			<RecipientBox bind:filter />
		</div>
	</div>
	<Handle type="source" position={Position.Bottom} class="h-3! w-3!" />
</div>
