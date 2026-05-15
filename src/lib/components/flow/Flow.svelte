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
	import {
		startingNodes,
		addNode,
		createDefaultEdge,
		parentAllowsDefaultAutoEdge
	} from './nodes/addNode.js';
	import type { Flow } from '$lib/schema/flow';
	const {
		backButtonUrl,
		disabled = false,
		nodes: inputNodes,
		edges: inputEdges,
		onSave = async ({ nodes, edges }: Flow) => {},
		onSend = async ({ nodes, edges }: Flow) => {},
		onDiscard = async () => {},
		onTest
	}: {
		backButtonUrl?: string;
		disabled?: boolean;
		nodes: Node[];
		edges: Edge[];
		onSave?: ({ nodes, edges }: Flow) => Promise<void> | void;
		onSend?: ({ nodes, edges }: Flow) => Promise<void> | void;
		onDiscard?: () => Promise<void> | void;
		onTest?: ({ nodes, edges }: Flow) => Promise<void> | void;
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
	import FlaskConicalIcon from '@lucide/svelte/icons/flask-conical';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';

	const templateNode = $derived(nodes.find((n) => n.type === 'templateMessage'));
	const templateIdForRead = $derived(
		(templateNode?.data as { templateId?: string } | undefined)?.templateId
	);
	const templateReadQuery = $derived.by(() => {
		const id = templateIdForRead;
		if (!id) return null;
		return z.createQuery(queries.whatsappTemplate.read({ templateId: id }));
	});
	const templateLoaded = $derived(templateReadQuery?.details?.type === 'complete');
	const templateStatus = $derived(templateReadQuery?.data?.status ?? null);
	const isTemplateApproved = $derived(templateLoaded && templateStatus === 'APPROVED');
	const canSend = $derived(!disabled && !!templateNode && templateLoaded && isTemplateApproved);
	const showApprovalBanner = $derived(
		!disabled && !!templateIdForRead && templateLoaded && !isTemplateApproved
	);

	const activeWhatsAppOnboarded = $derived(
		appState.activeOrganization?.data?.settings.whatsApp.wabaId &&
			appState.activeOrganization?.data?.settings.whatsApp.number &&
			appState.activeOrganization?.data?.settings.whatsApp.defaultTemplateId
	);

	function appendNodeWithDefaultEdge(newNode: Node | null, parentNode: Node) {
		if (!newNode) return;

		nodes = [...nodes, newNode];

		if (
			parentAllowsDefaultAutoEdge(parentNode, {
				templateComponents: templateReadQuery?.data?.components
			})
		) {
			edges = [...edges, createDefaultEdge(parentNode.id, newNode.id)];
		}
	}
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
				{#if showApprovalBanner}
					<Panel position="top-center" class="pointer-events-auto z-10 max-w-xl px-4">
						<Alert.Root>
							<TriangleAlertIcon />
							<Alert.Title>{t`Template not approved`}</Alert.Title>
							<Alert.Description class="space-y-2">
								{#if templateReadQuery?.data}
									<p>
										{t`The selected template (${templateReadQuery.data.name}) is currently ${String(templateStatus)}. You can edit this draft, but it cannot be sent until the template is approved.`}
									</p>
								{:else}
									<p>
										{t`This template is not available or is not approved. Select an approved template before sending.`}
									</p>
								{/if}
								{#if templateIdForRead}
									<div>
										<Button
											variant="outline"
											size="sm"
											href="/settings/whatsapp/templates/{templateIdForRead}"
										>
											{t`View template settings`}
										</Button>
									</div>
								{/if}
							</Alert.Description>
						</Alert.Root>
					</Panel>
				{/if}
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
							{#if onTest}
								<Button
									variant="outline"
									size="sm"
									data-testid="flow-test-button"
									onclick={() =>
										onTest({
											nodes: $state.snapshot(nodes) as unknown as Flow['nodes'],
											edges: $state.snapshot(edges) as Flow['edges']
										})}
								>
									<FlaskConicalIcon class="size-4" />
									{t`Send test message`}
								</Button>
							{/if}
							<Button
								variant="destructive"
								size="sm"
								data-testid="flow-discard-button"
								onclick={onDiscard}>{t`Discard`}</Button
							>
							<Button
								variant="outline"
								size="sm"
								data-testid="flow-save-button"
								onclick={() =>
									onSave({
										nodes: $state.snapshot(nodes) as unknown as Flow['nodes'],
										edges: $state.snapshot(edges) as Flow['edges']
									})}>{t`Save`}</Button
							>
							{#if !canSend}
								<Tooltip.Root>
									<Tooltip.Trigger>
										{#snippet child({ props })}
											<span {...props} class="inline-flex">
												<Button
													variant="default"
													size="sm"
													data-testid="flow-send-button"
													disabled
													type="button">{t`Send`}</Button
												>
											</span>
										{/snippet}
									</Tooltip.Trigger>
									<Tooltip.Content class="max-w-xs" side="top">
										{t`Only approved WhatsApp templates can be sent. Select an approved template or wait for Meta to approve your template.`}
									</Tooltip.Content>
								</Tooltip.Root>
							{:else}
								<Button
									variant="default"
									size="sm"
									data-testid="flow-send-button"
									onclick={() =>
										onSend({
											nodes: $state.snapshot(nodes) as unknown as Flow['nodes'],
											edges: $state.snapshot(edges) as unknown as Flow['edges']
										})}>{t`Send`}</Button
								>
							{/if}
						</div>
					</Panel>
				{/if}
				{#if !disabled}
					<Panel position="top-right">
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								<Button variant="default" size="sm" data-testid="flow-add-node-trigger">
									<ChevronDownIcon />
									{t`Add Node`}
								</Button>
							</DropdownMenu.Trigger>
							<DropdownMenu.Content>
								<DropdownMenu.Item
									data-testid="flow-add-node-message"
									onclick={() => {
										const nodesSnapshot = nodes as Node[];
										const parentNode = nodesSnapshot[nodesSnapshot.length - 1];
										if (!parentNode) return;
										appendNodeWithDefaultEdge(
											addNode('message', parentNode, nodesSnapshot) as Node | null,
											parentNode
										);
									}}
								>
									{t`Message`}
								</DropdownMenu.Item>
								<DropdownMenu.Item
									onclick={() => {
										const nodesSnapshot = nodes as Node[];
										const parentNode = nodesSnapshot[nodesSnapshot.length - 1];
										if (!parentNode) return;
										appendNodeWithDefaultEdge(
											addNode('eventSignup', parentNode, nodesSnapshot) as Node | null,
											parentNode
										);
									}}
								>
									{t`Event Signup`}
								</DropdownMenu.Item>
								<DropdownMenu.Item
									onclick={() => {
										const nodesSnapshot = nodes as Node[];
										const parentNode = nodesSnapshot[nodesSnapshot.length - 1];
										if (!parentNode) return;
										appendNodeWithDefaultEdge(
											addNode('petitionSignup', parentNode, nodesSnapshot) as Node | null,
											parentNode
										);
									}}
								>
									{t`Petition Signup`}
								</DropdownMenu.Item>
								<DropdownMenu.Item
									onclick={() => {
										const nodesSnapshot = nodes as Node[];
										const parentNode = nodesSnapshot[nodesSnapshot.length - 1];
										if (!parentNode) return;
										appendNodeWithDefaultEdge(
											addNode('tagAdd', parentNode, nodesSnapshot) as Node | null,
											parentNode
										);
									}}
								>
									{t`Tag Add`}
								</DropdownMenu.Item>
								<DropdownMenu.Item
									onclick={() => {
										const nodesSnapshot = nodes as Node[];
										const parentNode = nodesSnapshot[nodesSnapshot.length - 1];
										if (!parentNode) return;
										appendNodeWithDefaultEdge(
											addNode('teamAdd', parentNode, nodesSnapshot) as Node | null,
											parentNode
										);
									}}
								>
									{t`Team Add`}
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
