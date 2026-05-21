<script lang="ts">
	import {
		BaseEdge,
		EdgeToolbar,
		getBezierPath,
		useEdges,
		type EdgeProps,
		useStore
	} from '@xyflow/svelte';
	let { id, sourceX, sourceY, targetX, targetY, selected }: EdgeProps = $props();
	import UnlinkIcon from '@lucide/svelte/icons/unlink';
	let [edgePath, centerX, centerY] = $derived(
		getBezierPath({
			sourceX,
			sourceY,
			targetX,
			targetY
		})
	);

	const edges = useEdges();
	const { elementsSelectable, nodesDraggable, nodesConnectable } = useStore();
	const isDisabled = $derived(
		elementsSelectable === false || nodesDraggable === false || nodesConnectable === false
	);
</script>

<BaseEdge {id} path={edgePath} />
<EdgeToolbar x={centerX} y={centerY + 2} isVisible={selected} selectEdgeOnClick={true}>
	<button
		class:pointer-events-none={isDisabled}
		onclick={() => edges.update((eds) => eds.filter((edge) => edge.id !== id))}
		class="text-muted-foreground opacity-70 hover:text-foreground hover:opacity-100"
	>
		<UnlinkIcon class="size-3" />
	</button>
</EdgeToolbar>
