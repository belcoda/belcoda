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
		type EdgeTypes,
		type NodeTypes
	} from '@xyflow/svelte';
	import { startingNodes, addNode } from './nodes/addNode.js';
	const { backButtonUrl, disabled = false }: { backButtonUrl?: string; disabled?: boolean } =
		$props();
	//nodes
	import Message from './nodes/Message.svelte';
	import EventSignup from './nodes/EventSignup.svelte';
	import TagAdd from './nodes/TagAdd.svelte';
	import Targeting from './nodes/Targeting.svelte';
	import TemplateMessage from './nodes/TemplateMessage.svelte';
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
		tagAdd: TagAdd,
		templateMessage: TemplateMessage
	};

	//state
	const { nodes: startingNodesList, edges: startingEdgesList } = startingNodes({
		defaultTemplateId: appState.activeOrganization?.data?.settings.whatsApp.defaultTemplateId
	});
	let nodes: Node[] = $state.raw(startingNodesList);
	let edges = $state.raw(startingEdgesList);

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
								Back
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
									Snapshot
								</Button>
							{/if}
							<Button variant="destructive" size="sm">Discard</Button>
							<Button variant="outline" size="sm">Save</Button>
							<Button variant="default" size="sm">Send</Button>
						</div>
					</Panel>
				{/if}
				{#if !disabled}
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
											//@ts-ignore
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
