<script lang="ts">
	import {
		SvelteFlow,
		SvelteFlowProvider,
		Background,
		Panel,
		type EdgeTypes
	} from '@xyflow/svelte';

	import '@xyflow/svelte/dist/style.css';
	import type { FlowNode } from './types';
	import TestEdge from './edges/TestEdge.svelte';
	import { findPositionRadial } from './placeNode';
	import { startingNodes, addNode } from './nodes/addNode';
	const edgeTypes: EdgeTypes = {
		'test-edge': TestEdge
	};
	const { nodes: startingNodesList, edges: startingEdgesList } = startingNodes();
	let nodes: FlowNode[] = $state.raw(startingNodesList);
	let edges = $state.raw(startingEdgesList);
	import Message from './nodes/Message.svelte';
	import EventSignup from './nodes/EventSignup.svelte';
	import TagAdd from './nodes/TagAdd.svelte';
	import Targeting from './nodes/Targeting.svelte';
	const nodeTypes = {
		message: Message,
		eventSignup: EventSignup,
		targeting: Targeting,
		tagAdd: TagAdd
	};
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
</script>

<div class="h-full w-full">
	<SvelteFlowProvider>
		<SvelteFlow
			bind:nodes
			bind:edges
			fitView
			{nodeTypes}
			{edgeTypes}
			defaultEdgeOptions={{ type: 'test-edge' }}
		>
			<Panel position="top-right">
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						<Button variant="default" size="sm">
							<ChevronDownIcon />
							Add Node
						</Button>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content>
						<DropdownMenu.Item
							onclick={() => {
								const newNode = addNode('message', nodes[nodes.length - 1], $state.snapshot(nodes));
								if (newNode) {
									nodes = [...nodes, newNode];
								}
							}}
						>
							Message
						</DropdownMenu.Item>
						<DropdownMenu.Item
							onclick={() => {
								const newNode = addNode(
									'eventSignup',
									nodes[nodes.length - 1],
									$state.snapshot(nodes)
								);
								if (newNode) {
									nodes = [...nodes, newNode];
								}
							}}
						>
							Event Signup
						</DropdownMenu.Item>
						<DropdownMenu.Item
							onclick={() => {
								const newNode = addNode('tagAdd', nodes[nodes.length - 1], $state.snapshot(nodes));
								if (newNode) {
									nodes = [...nodes, newNode];
								}
							}}
						>
							Tag Add
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</Panel>
			<Background />
		</SvelteFlow>
	</SvelteFlowProvider>
</div>
