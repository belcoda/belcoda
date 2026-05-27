<script lang="ts">
	import { t } from '$lib/index.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { Panel, useNodes } from '@xyflow/svelte';
	const nodes = useNodes();
	import type { NodeType } from '$lib/schema/flow';
	import { addNode } from './nodes/addNode.js';

	function appendNode(nodeType: NodeType) {
		const nodesSnapshot = nodes.current;
		const parentNode = nodesSnapshot[nodesSnapshot.length - 1];
		if (!parentNode) return;
		const newNode = addNode({ nodeType, parentNode, nodes: nodesSnapshot });
		if (!newNode) return;
		nodes.update((currentNodes) => [...currentNodes, newNode]);
	}
</script>

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
					appendNode('message');
				}}
			>
				{t`Message`}
			</DropdownMenu.Item>
			<DropdownMenu.Item
				onclick={() => {
					appendNode('eventSignup');
				}}
			>
				{t`Event Signup`}
			</DropdownMenu.Item>
			<DropdownMenu.Item
				onclick={() => {
					appendNode('petitionSignup');
				}}
			>
				{t`Petition Signup`}
			</DropdownMenu.Item>
			<DropdownMenu.Item
				onclick={() => {
					appendNode('tagAdd');
				}}
			>
				{t`Tag Add`}
			</DropdownMenu.Item>
			<DropdownMenu.Item
				onclick={() => {
					appendNode('teamAdd');
				}}
			>
				{t`Team Add`}
			</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</Panel>
