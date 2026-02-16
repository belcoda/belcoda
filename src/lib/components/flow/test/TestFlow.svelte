<script lang="ts">
	import { SvelteFlow, Background } from '@xyflow/svelte';

	import '@xyflow/svelte/dist/style.css';
	import type { WhatsAppNodeData } from './types';

	let nodes: WhatsAppNodeData[] = $state.raw([
		{
			id: 'node-1',
			type: 'message',
			position: { x: 0, y: 0 },
			data: { text: 'some text', buttons: [], imageUrl: null }
		},
		{
			id: 'node-2',
			type: 'message',
			position: { x: 250, y: 500 },
			data: { text: 'some text', buttons: [], imageUrl: null }
		},
		{
			id: 'node-3',
			type: 'message',
			position: { x: 500, y: 500 },
			data: { text: 'some text', buttons: [], imageUrl: null }
		}
	]);

	let edges = $state.raw([]);
	import Message from './nodes/Message.svelte';
	const nodeTypes = { message: Message };
</script>

<div class="h-full w-full">
	<SvelteFlow bind:nodes bind:edges fitView {nodeTypes}>
		<Background />
	</SvelteFlow>
</div>
