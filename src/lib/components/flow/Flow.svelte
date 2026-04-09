<script lang="ts">
	import '@xyflow/svelte/dist/style.css';
	import { t } from '$lib/index.svelte';
	import { dev } from '$app/environment';
	import { appState } from '$lib/state.svelte';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import FolderCodeIcon from '@lucide/svelte/icons/folder-code';
	import {
		SvelteFlow,
		SvelteFlowProvider,
		Background,
		Panel,
		type Node,
		type Edge,
		type EdgeTypes,
		type NodeTypes
	} from '@xyflow/svelte';
	import { startingNodes, addNode } from './nodes/addNode.js';
	import type { Flow } from '$lib/schema/flow';
	const {
		backButtonUrl,
		disabled = false,
		nodes: inputNodes,
		edges: inputEdges,
		onSave = async ({ nodes, edges }: Flow) => {},
		onSend = async ({ nodes, edges }: Flow) => {},
		onDiscard = async () => {}
	}: {
		backButtonUrl?: string;
		disabled?: boolean;
		nodes: Node[];
		edges: Edge[];
		onSave?: ({ nodes, edges }: Flow) => Promise<void>;
		onSend?: ({ nodes, edges }: Flow) => Promise<void>;
		onDiscard?: () => Promise<void>;
	} = $props();
	//nodes
	import Message from '$lib/components/flow/nodes/Message.svelte';
	import EventSignup from '$lib/components/flow/nodes/EventSignup.svelte';
	import PetitionSignup from '$lib/components/flow/nodes/PetitionSignup.svelte';
	import TagAdd from '$lib/components/flow/nodes/TagAdd.svelte';
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
		templateMessage: TemplateMessage
	};

	//state
	const { nodes: startingNodesList, edges: startingEdgesList } = startingNodes({
		defaultTemplateId: appState.activeOrganization?.data?.settings.whatsApp.defaultTemplateId
	});
	/* svelte-ignore state_referenced_locally */
	let nodes: Node[] = $state.raw(inputNodes ?? startingNodesList);
	/* svelte-ignore state_referenced_locally */
	let edges = $state.raw(inputEdges ?? startingEdgesList);

	//components
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';

	const activeWhatsAppOnboarded = $derived(
		appState.activeOrganization?.data?.settings.whatsApp.wabaId &&
			appState.activeOrganization?.data?.settings.whatsApp.number &&
			appState.activeOrganization?.data?.settings.whatsApp.defaultTemplateId
	);
</script>

{#if activeWhatsAppOnboarded}
	<div class="h-full w-full">
		<SvelteFlowProvider>
			<SvelteFlow
				elementsSelectable={!disabled}
				nodesDraggable={!disabled}
				nodesConnectable={!disabled}
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
								{t`Back`}
							</Button>
						</div>
					</Panel>
				{/if}
				{#if !disabled}
					<Panel position="bottom-right">
						<div class="flex items-center gap-2">
							{#if dev}
								<Button
									variant="outline"
									size="sm"
									onclick={() => alert(JSON.stringify($state.snapshot({ nodes, edges })))}
								>
									{t`Snapshot`}
								</Button>
							{/if}
							<Button variant="destructive" size="sm" onclick={onDiscard}>{t`Discard`}</Button>
							<Button
								variant="outline"
								size="sm"
								onclick={() =>
									onSave({
										nodes: $state.snapshot(nodes) as unknown as Flow['nodes'],
										edges: $state.snapshot(edges) as Flow['edges']
									})}>{t`Save`}</Button
							>
							<Button
								variant="default"
								size="sm"
								onclick={() =>
									onSend({
										nodes: $state.snapshot(nodes) as unknown as Flow['nodes'],
										edges: $state.snapshot(edges) as Flow['edges']
									})}>{t`Send`}</Button
							>
						</div>
					</Panel>
				{/if}
				{#if !disabled}
					<Panel position="top-right">
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								<Button variant="default" size="sm">
									<ChevronDownIcon />
									{t`Add Node`}
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
											//@ts-ignore
											nodesSnapshot[nodesSnapshot.length - 1] as Node,
											nodesSnapshot as Node[]
										);
										if (newNode) {
											nodes = [...nodes, newNode];
										}
									}}
								>
									{t`Message`}
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
									{t`Event Signup`}
								</DropdownMenu.Item>
								<DropdownMenu.Item
									onclick={() => {
										const nodesSnapshot = $state.snapshot(nodes);
										const newNode = addNode(
											'petitionSignup',
											nodesSnapshot[nodesSnapshot.length - 1] as Node,
											nodesSnapshot as Node[]
										);
										if (newNode) {
											nodes = [...nodes, newNode];
										}
									}}
								>
									{t`Petition Signup`}
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
									{t`Tag Add`}
								</DropdownMenu.Item>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					</Panel>
				{/if}
				<Background />
			</SvelteFlow>
		</SvelteFlowProvider>
	</div>
{:else}
	<div class="flex h-full w-full items-center justify-center">
		<Empty.Root>
			<Empty.Header>
				<Empty.Media variant="icon">
					<FolderCodeIcon />
				</Empty.Media>
				<Empty.Title>{t`WhatsApp not activated`}</Empty.Title>
				<Empty.Description
					>{t`In order to use WhatsApp messaging features, you need to activate your organization's WhatsApp Business account.`}</Empty.Description
				>
			</Empty.Header>
			<Empty.Content>
				<Button href="/settings/whatsapp/accounts">{t`Activate WhatsApp`}</Button>
			</Empty.Content>
		</Empty.Root>
	</div>
{/if}
