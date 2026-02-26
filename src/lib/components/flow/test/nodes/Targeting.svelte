<script lang="ts">
	import {
		Position,
		useSvelteFlow,
		type NodeProps,
		Handle,
		useUpdateNodeInternals
	} from '@xyflow/svelte';
	import { Plus, Trash2, Image as ImageIcon, X } from '@lucide/svelte';
	import type { EventSignupNodeData } from '../types';
	let { id, data }: NodeProps<EventSignupNodeData> = $props();
	const { updateNodeData } = useSvelteFlow();
	const updateNodeInternals = useUpdateNodeInternals();
	/*svelte-ignore state_referenced_locally */
	let eventId = $state(data.eventId ?? null);
	/* $effect(() => {
		updateNodeData(id, { eventId });
		updateNodeInternals(id);
	}); */

	import RecipientBox from '$lib/components/widgets/communications/recipients/RecipientBox.svelte';
</script>

<div class="relative w-[460px] font-sans drop-shadow-md">
	<div class="rounded-lg border border-[#b7e4ac] bg-[#d9fdd3]">
		<div
			class="hover:bg-white/50m -mb-1 w-full border-b border-[#b7e4ac] bg-[#f8f9fa]/50 p-2 px-2 pt-2 text-[11px] font-medium text-[#008069] uppercase transition-colors"
		>
			Recipients:
		</div>
		<div class=" p-2">
			<RecipientBox />
		</div>
	</div>
	<Handle type="source" position={Position.Bottom} class="h-3! w-3!" />
</div>
