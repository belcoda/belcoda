<script lang="ts">
	import {
		Position,
		useSvelteFlow,
		type NodeProps,
		Handle,
		useUpdateNodeInternals
	} from '@xyflow/svelte';
	import type { TagAddNodeData } from '../types';
	let { id, data }: NodeProps<TagAddNodeData> = $props();
	const { updateNodeData } = useSvelteFlow();
	const updateNodeInternals = useUpdateNodeInternals();
	/*svelte-ignore state_referenced_locally */
	let tagId = $state(data.tagId ?? null);

	import TagAddCombobox from './tag_add/Combobox.svelte';
</script>

<div class="relative w-[260px] font-sans drop-shadow-md">
	<Handle type="target" position={Position.Top} class="z-20 h-3! w-3!" />

	<div class="rounded-lg border border-[#b7e4ac] bg-[#d9fdd3]">
		<div
			class="hover:bg-white/50m -mb-1 w-full border-b border-[#b7e4ac] bg-[#f8f9fa]/50 p-2 px-2 pt-2 text-[11px] font-medium text-[#008069] uppercase transition-colors"
		>
			Add to tag:
		</div>
		<div class=" p-2">
			<TagAddCombobox
				value={tagId}
				class="w-full"
				onSelectChange={(tagId) => {
					updateNodeData(id, { tagId });
					updateNodeInternals(id);
				}}
			/>
		</div>
	</div>
	<Handle type="source" position={Position.Bottom} class="h-3! w-3!" />
</div>
