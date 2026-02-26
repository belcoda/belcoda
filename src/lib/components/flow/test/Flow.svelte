<script lang="ts">
	import '@xyflow/svelte/dist/style.css';
	import { dev } from '$app/environment';
	import {
		SvelteFlow,
		SvelteFlowProvider,
		Background,
		Panel,
		type Node,
		type EdgeTypes,
		type NodeTypes
	} from '@xyflow/svelte';
	import { startingNodes, addNode } from './nodes/addNode.js';
	const { backButtonUrl }: { backButtonUrl?: string } = $props();
	//nodes
	import Message from './nodes/Message.svelte';
	import EventSignup from './nodes/EventSignup.svelte';
	import TagAdd from './nodes/TagAdd.svelte';
	import Targeting from './nodes/Targeting.svelte';
	//edges
	import NodeEdge from './edges/NodeEdge.svelte';

	//types
	const edgeTypes: EdgeTypes = {
		edge: NodeEdge
	};
	const nodeTypes: NodeTypes = {
		message: Message,
		eventSignup: EventSignup,
		targeting: Targeting,
		tagAdd: TagAdd
	};

	//state
	const { nodes: startingNodesList, edges: startingEdgesList } = startingNodes();
	let nodes: Node[] = $state.raw(startingNodesList);
	let edges = $state.raw(startingEdgesList);

	//components
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
</script>

<div class="h-full w-full">
	<SvelteFlowProvider>
		<SvelteFlow
			proOptions={{
				hideAttribution: true
			}}
			bind:nodes
			bind:edges
			fitView
			fitViewOptions={{
				maxZoom: 1,
				minZoom: 0.5
			}}
			{nodeTypes}
			{edgeTypes}
			defaultEdgeOptions={{ type: 'edge' }}
		>
			{#if backButtonUrl}
				<Panel position="top-left">
					<div class="flex flex-col gap-2">
						<Button variant="outline" size="sm" href={backButtonUrl}>
							<ChevronLeftIcon />
							Back
						</Button>
						{#if dev}
							<Button
								variant="outline"
								size="sm"
								onclick={() => alert(JSON.stringify($state.snapshot({ nodes, edges })))}
							>
								Snapshot
							</Button>
						{/if}
					</div>
				</Panel>
			{/if}
			<Panel position="bottom-right">
				<div class="flex items-center gap-2">
					<Button variant="outline" size="sm">Discard</Button>
					<Button variant="default" size="sm">Send</Button>
				</div>
			</Panel>
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
								const nodesSnapshot = $state.snapshot(nodes);
								const nodeLength = nodesSnapshot.length;
								const finalNode = nodesSnapshot[nodeLength - 1];
								const newNode = addNode(
									'message',
									nodesSnapshot[nodesSnapshot.length - 1] as Node,
									nodesSnapshot as Node[]
								);
								if (newNode) {
									nodes = [...nodes, newNode];
								}
							}}
						>
							Message
						</DropdownMenu.Item>
						<DropdownMenu.Item
							onclick={() => {
								const nodesSnapshot = $state.snapshot(nodes);
								const newNode = addNode(
									'eventSignup',
									nodesSnapshot[nodesSnapshot.length - 1] as Node,
									nodesSnapshot as Node[]
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
								const nodesSnapshot = $state.snapshot(nodes);
								const newNode = addNode(
									'tagAdd',
									nodesSnapshot[nodesSnapshot.length - 1] as Node,
									nodesSnapshot as Node[]
								);
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
