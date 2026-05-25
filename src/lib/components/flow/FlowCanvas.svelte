<script lang="ts">
	import '@xyflow/svelte/dist/style.css';
	import { t } from '$lib/index.svelte';
	import {
		SvelteFlow,
		Background,
		Panel,
		type EdgeTypes,
		type NodeTypes,
		type OnConnectEnd,
		useSvelteFlow,
		useNodes,
		useEdges
	} from '@xyflow/svelte';
	import AppendNode from '$lib/components/flow/AppendNode.svelte';
	import { getNodes, getEdges, setNodes, setEdges } from '$lib/components/flow/flow_state.svelte';
	const {
		backButtonUrl,
		disabled = false
	}: {
		backButtonUrl?: string;
		disabled?: boolean;
	} = $props();
	//nodes
	import Message from '$lib/components/flow/nodes/Message.svelte';
	import EventSignup from '$lib/components/flow/nodes/EventSignup.svelte';
	import PetitionSignup from '$lib/components/flow/nodes/PetitionSignup.svelte';
	import TagAdd from '$lib/components/flow/nodes/TagAdd.svelte';
	import TeamAdd from '$lib/components/flow/nodes/TeamAdd.svelte';
	import Targeting from '$lib/components/flow/nodes/Targeting.svelte';
	import TemplateMessage from '$lib/components/flow/nodes/TemplateMessage.svelte';
	//edges
	import NodeEdge from '$lib/components/flow/edges/NodeEdge.svelte';

	//types
	const edgeTypes: EdgeTypes = {
		edge: NodeEdge
	};
	const nodeTypes: NodeTypes = {
		message: Message,
		eventSignup: EventSignup,
		petitionSignup: PetitionSignup,
		targeting: Targeting,
		tagAdd: TagAdd,
		teamAdd: TeamAdd,
		templateMessage: TemplateMessage
	};

	const nodes = useNodes();
	const edges = useEdges();
	const { screenToFlowPosition } = useSvelteFlow();

	//components
	import { addNode } from '$lib/components/flow/nodes/addNode.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import WhatsAppFlowStatePanels from '$lib/components/flow/WhatsAppFlowStatePanels.svelte';
	import StateProvider from '$lib/components/flow/DisplaySavedState.svelte';
	import { v4 as uuidv4 } from 'uuid';

	let menuVisible = $state(false);
	let menuPosition = $state({ x: 0, y: 0 });
	let newNodePosition = $state({ x: 0, y: 0 });
	let mouse = $state({ x: 0, y: 0 });
	let fromNodeId: string | null = $state(null);
	let fromHandleId: string | null = $state(null);

	export const handleConnectEnd: OnConnectEnd = (event, connectionState) => {
		if (connectionState.isValid) return;

		fromNodeId = connectionState.fromNode?.id || null;
		fromHandleId = connectionState.fromHandle?.id || null;
		const { clientX, clientY } = 'changedTouches' in event ? event.changedTouches[0] : event;
		newNodePosition = screenToFlowPosition({
			x: clientX,
			y: clientY
		});

		menuVisible = true;
		menuPosition = { x: mouse.x, y: mouse.y };
	};
	import type { NodeType } from '$lib/schema/flow';

	function addNodeToFlow(nodeType: NodeType) {
		menuVisible = false;
		const newNodeId = uuidv4();
		const newNode = addNode({
			id: newNodeId,
			nodeType,
			parentNode: nodes.current[nodes.current.length - 1],
			nodes: nodes.current,
			inputPosition: {
				x: newNodePosition.x,
				y: newNodePosition.y
			}
		});
		if (!newNode) return;
		nodes.update((currentNodes) => [...currentNodes, newNode]);
		edges.update((currentEdges) => {
			if (!fromNodeId) return currentEdges;
			return [
				...currentEdges,
				{
					source: fromNodeId,
					...(fromHandleId ? { sourceHandle: fromHandleId } : {}),
					target: newNode.id,
					id: `xy-edge__${fromHandleId ? fromHandleId : fromNodeId}--${newNode.id}`
				}
			];
		});
	}

	// Handle the event listener mounting and cleanup
	$effect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			mouse.x = e.clientX;
			mouse.y = e.clientY;
		};

		window.addEventListener('mousemove', handleMouseMove);

		// Svelte 5 automatically runs this return function when the component unmounts
		return () => {
			window.removeEventListener('mousemove', handleMouseMove);
		};
	});

	// --- THE INTERACTION KILLER EFFECT ---
	$effect(() => {
		if (!menuVisible) return;

		const dismissMenu = () => {
			menuVisible = false;
		};

		// Timeout bypasses the immediate mouseup/click event of the edge drop
		const timeoutId = setTimeout(() => {
			window.addEventListener('click', dismissMenu);
			window.addEventListener('pointerdown', dismissMenu);
		}, 0);

		return () => {
			clearTimeout(timeoutId);
			window.removeEventListener('click', dismissMenu);
			window.removeEventListener('pointerdown', dismissMenu);
		};
	});
</script>

<SvelteFlow
	elementsSelectable={!disabled}
	nodesDraggable={!disabled}
	nodesConnectable={!disabled}
	proOptions={{
		hideAttribution: true
	}}
	onconnectend={handleConnectEnd}
	connectionRadius={50}
	bind:nodes={getNodes, setNodes}
	onmovestart={() => (menuVisible = false)}
	bind:edges={getEdges, setEdges}
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
					{t`Back`}
				</Button>
			</div>
		</Panel>
	{/if}
	{#if !disabled}
		<WhatsAppFlowStatePanels />
		<AppendNode />
		<StateProvider />
	{/if}
	<Background />
</SvelteFlow>

{#if menuVisible}
	<div
		style:top={menuPosition.y + 'px'}
		style:left={menuPosition.x + 'px'}
		style:position="absolute"
		role="menu"
		onclick={(e) => e.stopPropagation()}
		onpointerdown={(e) => e.stopPropagation()}
		class="z-20 rounded-md border bg-white shadow-xl"
		onkeydown={(e) => {
			if (e.key === 'Escape') {
				menuVisible = false;
			}
		}}
		tabindex="-1"
	>
		<div class="space-y-px" role="group">
			<Button
				tabindex={0}
				variant="ghost"
				class="relative flex w-full items-center rounded-sm px-2 py-1.5 text-sm text-neutral-700 transition-colors outline-none select-none hover:bg-neutral-100 hover:text-neutral-900 focus:bg-neutral-100 focus:text-neutral-900 disabled:pointer-events-none disabled:opacity-50"
				role="menuitem"
				onclick={(e) => {
					addNodeToFlow('message');
				}}
			>
				<span class="flex-1 text-left">Message</span>
			</Button>
			<Button
				tabindex={0}
				variant="ghost"
				class="relative flex w-full items-center rounded-sm px-2 py-1.5 text-sm text-neutral-700 transition-colors outline-none select-none hover:bg-neutral-100 hover:text-neutral-900 focus:bg-neutral-100 focus:text-neutral-900 disabled:pointer-events-none disabled:opacity-50"
				role="menuitem"
				onclick={() => {
					addNodeToFlow('eventSignup');
				}}
			>
				<span class="flex-1 text-left">Event Signup</span>
			</Button>
			<Button
				tabindex={0}
				variant="ghost"
				class="relative flex w-full items-center rounded-sm px-2 py-1.5 text-sm text-neutral-700 transition-colors outline-none select-none hover:bg-neutral-100 hover:text-neutral-900 focus:bg-neutral-100 focus:text-neutral-900 disabled:pointer-events-none disabled:opacity-50"
				role="menuitem"
				onclick={() => {
					addNodeToFlow('petitionSignup');
				}}
			>
				<span class="flex-1 text-left">Petition Signup</span>
			</Button>
			<Button
				tabindex={0}
				variant="ghost"
				class="relative flex w-full items-center rounded-sm px-2 py-1.5 text-sm text-neutral-700 transition-colors outline-none select-none hover:bg-neutral-100 hover:text-neutral-900 focus:bg-neutral-100 focus:text-neutral-900 disabled:pointer-events-none disabled:opacity-50"
				role="menuitem"
				onclick={() => {
					addNodeToFlow('tagAdd');
				}}
			>
				<span class="flex-1 text-left">Tag Add</span>
			</Button>
			<Button
				tabindex={0}
				variant="ghost"
				class="relative flex w-full items-center rounded-sm px-2 py-1.5 text-sm text-neutral-700 transition-colors outline-none select-none hover:bg-neutral-100 hover:text-neutral-900 focus:bg-neutral-100 focus:text-neutral-900 disabled:pointer-events-none disabled:opacity-50"
				role="menuitem"
				onclick={() => {
					addNodeToFlow('teamAdd');
				}}
			>
				<span class="flex-1 text-left">Team Add</span>
			</Button>
		</div>
	</div>
{/if}
