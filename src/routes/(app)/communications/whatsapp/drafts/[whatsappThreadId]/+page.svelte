<script lang="ts">
	import Flow from '$lib/components/flow/Flow.svelte';
	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';
	const { params } = $props();
	import { t } from '$lib/index.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import { appState } from '$lib/state.svelte';
	import { startingNodes } from '$lib/components/flow/nodes/addNode';
	import { page } from '$app/state';
	import { setNodes, setEdges, getNodes, getEdges } from '$lib/components/flow/flow_state.svelte';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import FolderCodeIcon from '@lucide/svelte/icons/folder-code';
	import { replaceState } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { Flow as WhatsappFlow } from '$lib/schema/flow';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import type { Node, Edge } from '@xyflow/svelte';
	const defaultCreateMode = page.url.searchParams.get('defaultCreateMode') === 'true';
	replaceState('', {});

	import { onMount } from 'svelte';

	async function loadFlow() {
		try {
			const existingThread = await z.run(
				queries.whatsappThread.read({
					threadId: params.whatsappThreadId
				})
			);
			if (!existingThread) {
				const flow = startingNodes({
					defaultTemplateId: appState.activeOrganization?.data?.settings.whatsApp.defaultTemplateId
				});
				return { nodes: flow.nodes, edges: flow.edges };
			} else {
				return { nodes: existingThread.flow.nodes, edges: existingThread.flow.edges };
			}
		} catch (error) {
			console.error(error);
			return { nodes: [], edges: [] };
		}
	}

	//state for displaying the flow.
	const templateNode = $derived(getNodes().find((n) => n.type === 'templateMessage'));
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
	const canSend = $derived(!!templateNode && templateLoaded && isTemplateApproved);
	const showTemplateApprovalBanner = $derived(
		!!templateIdForRead && templateLoaded && !isTemplateApproved
	);
	const hasTemplateId = $derived(
		appState.activeOrganization?.data?.settings.whatsApp.defaultTemplateId
	);
	const activeWhatsAppOnboarded = $derived(
		appState.activeOrganization?.data?.settings.whatsApp.wabaId &&
			appState.activeOrganization?.data?.settings.whatsApp.number
	);
</script>

{#key params.whatsappThreadId}
	{#if !activeWhatsAppOnboarded}
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
	{:else if !hasTemplateId}
		<div class="flex h-full w-full items-center justify-center">
			<Empty.Root>
				<Empty.Header>
					<Empty.Media variant="icon">
						<FolderCodeIcon />
					</Empty.Media>
					<Empty.Title>{t`No default template`}</Empty.Title>
					<Empty.Description
						>{t`You must create WhatsApp templates and select a default for your organization before creating a flow`}</Empty.Description
					>
				</Empty.Header>
				<Empty.Content>
					<Button href="/settings/whatsapp/templates">{t`Manage templates`}</Button>
				</Empty.Content>
			</Empty.Root>
		</div>
	{:else}
		<Flow loadFlowFunction={loadFlow} backButtonUrl="/communications/whatsapp" />
	{/if}
{/key}
