<script lang="ts">
	import { BaseEdge, EdgeToolbar, getBezierPath, useEdges, type EdgeProps } from '@xyflow/svelte';
	let { id, sourceX, sourceY, targetX, targetY }: EdgeProps = $props();
	import CogIcon from '@lucide/svelte/icons/cog';
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
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
</script>

<BaseEdge {id} path={edgePath} />
<EdgeToolbar x={centerX} y={centerY} selectEdgeOnClick={true}>
	<DropdownMenu.Root>
		<DropdownMenu.Trigger class=" bg-transparent">
			<button class="rounded-full bg-transparent opacity-50 transition-opacity hover:opacity-100">
				<CogIcon class="size-5" />
			</button>
		</DropdownMenu.Trigger>
		<DropdownMenu.Content>
			<DropdownMenu.Item
				onclick={() => edges.update((eds) => eds.filter((edge) => edge.id !== id))}
			>
				<UnlinkIcon />
				Unlink
			</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</EdgeToolbar>
