<script lang="ts">
	import {
		Position,
		useSvelteFlow,
		type NodeProps,
		Handle,
		type Node,
		useUpdateNodeInternals
	} from '@xyflow/svelte';
	import type { EventSignupData } from '../types';
	let { id, data }: NodeProps<Node<EventSignupData, 'eventSignup'>> = $props();
	const { updateNodeData } = useSvelteFlow();
	const updateNodeInternals = useUpdateNodeInternals();
	/*svelte-ignore state_referenced_locally */
	let eventId = $state(data.eventId ?? null);
	$effect(() => {
		updateNodeData(id, { eventId });
		updateNodeInternals(id);
	});

	import EventSignupCombobox from './event_signup/Combobox.svelte';
</script>

<div class="relative w-[260px] font-sans drop-shadow-md">
	<Handle type="target" position={Position.Top} class="z-20 h-3! w-3!" />

	<div class="rounded-lg border border-[#b7e4ac] bg-[#d9fdd3]">
		<div
			class="hover:bg-white/50m -mb-1 w-full border-b border-[#b7e4ac] bg-[#f8f9fa]/50 p-2 px-2 pt-2 text-[11px] font-medium text-[#008069] uppercase transition-colors"
		>
			Add to event:
		</div>
		<div class=" p-2">
			<EventSignupCombobox
				value={eventId}
				class="w-full"
				onSelectChange={(eventId) => {
					updateNodeData(id, { eventId });
					updateNodeInternals(id);
				}}
			/>
		</div>
	</div>
	<Handle type="source" position={Position.Bottom} class="h-3! w-3!" />
</div>
