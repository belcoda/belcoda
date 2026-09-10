<script lang="ts">
	//*
	// Owns the lifecycle wiring between the editor page and the flow2 store: it points the store at the
	// flow_document to save to, seeds the canvas from the loaded draft, and registers the reload used
	// after a save conflict. Kept as a component (not a load function) so it can update state as the
	// page context changes without the editor being remounted.
	// */
	import {
		configureFlowDocument,
		registerReload,
		seedFromDoc,
		resetFlowState
	} from '$lib/components/flow2/flow_state.svelte';
	import { appState } from '$lib/state.svelte';
	import { onMount } from 'svelte';
	import type { Node, Edge } from '@xyflow/svelte';

	const {
		flowDocumentId,
		loadFlowFunction
	}: {
		flowDocumentId: string;
		loadFlowFunction: () => Promise<{ nodes: Node[]; edges: Edge[]; draftRevision: number }>;
	} = $props();

	onMount(() => {
		let cancelled = false;
		configureFlowDocument({ flowDocumentId, organizationId: appState.organizationId });
		// Re-seed the canvas from the latest loaded document (used after a save conflict). loadFlowFunction
		// reads the page's live query, so this always pulls the freshest graph + revision.
		registerReload(async () => {
			const doc = await loadFlowFunction();
			if (cancelled) return;
			seedFromDoc(doc);
		});
		(async () => {
			try {
				const doc = await loadFlowFunction();
				if (cancelled) return;
				seedFromDoc(doc);
			} catch (error) {
				if (cancelled) return;
				console.error(error);
				seedFromDoc({ nodes: [], edges: [], draftRevision: 0 });
			}
		})();
		return () => {
			cancelled = true;
			resetFlowState();
		};
	});
</script>
