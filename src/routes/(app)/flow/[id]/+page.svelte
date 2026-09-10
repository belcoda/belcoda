<script lang="ts">
	import Flow from '$lib/components/flow2/Flow.svelte';
	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';
	import { t } from '$lib/index.svelte';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import WorkflowIcon from '@lucide/svelte/icons/workflow';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { Node, Edge } from '@xyflow/svelte';

	const { params } = $props();

	// The flow resource: gates rendering (exists? still loading?) and gives us the document id.
	const flowQuery = $derived.by(() => z.createQuery(queries.flow.read({ flowId: params.id })));
	const flow = $derived(flowQuery.data);

	// Load (and reload-after-conflict) the editable draft. Fetched fresh each call via z.run so the
	// reload path always pulls the latest synced graph + revision.
	async function loadFlow(
		flowDocumentId: string
	): Promise<{ nodes: Node[]; edges: Edge[]; draftRevision: number }> {
		const doc = await z.run(queries.flowDocument.read({ flowDocumentId }));
		if (!doc) return { nodes: [], edges: [], draftRevision: 0 };
		return {
			// @ts-expect-error - stored flowSchema node/edge shape vs xyflow types not yet aligned
			nodes: doc.draftFlowDefinition.nodes,
			// @ts-expect-error - see above
			edges: doc.draftFlowDefinition.edges,
			draftRevision: doc.draftRevision ?? 0
		};
	}
</script>

{#key params.id}
	{#if flow}
		{@const flowDocumentId = flow.flowDocumentId}
		<Flow {flowDocumentId} loadFlowFunction={() => loadFlow(flowDocumentId)} />
	{:else if flowQuery.details.type === 'complete'}
		<div class="flex h-full w-full items-center justify-center">
			<Empty.Root>
				<Empty.Header>
					<Empty.Media variant="icon"><WorkflowIcon /></Empty.Media>
					<Empty.Title>{t`Flow not found`}</Empty.Title>
					<Empty.Description>
						{t`This flow doesn't exist or you don't have access to it.`}
					</Empty.Description>
					<Empty.Content>
						<Button href="/flow">{t`Back to flows`}</Button>
					</Empty.Content>
				</Empty.Header>
			</Empty.Root>
		</div>
	{/if}
{/key}
