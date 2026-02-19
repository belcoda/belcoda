<script lang="ts">
	import { SvelteFlow, Background, Panel } from '@xyflow/svelte';

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
	import { Button } from '$lib/components/ui/button/index.js';
	import PlusIcon from '@lucide/svelte/icons/plus';
</script>

<div class="h-full w-full">
	<SvelteFlow bind:nodes bind:edges fitView {nodeTypes}>
		<Panel position="top-left">
			<Button
				variant="outline"
				size="sm"
				onclick={() => {
					nodes = [
						...nodes,
						{
							id: 'node-' + nodes.length + 1,
							type: 'message',
							position: { x: 0, y: 0 },
							data: { text: 'some text', buttons: [], imageUrl: null }
						}
					];
				}}
			>
				<PlusIcon />
				Add Node
			</Button>
		</Panel>
		<Background />
	</SvelteFlow>
</div>
