<script lang="ts">
	import { ToggleGroup } from 'bits-ui';
	type Props = {
		mode: 'and' | 'or';
	};
	let { mode = $bindable('and') }: Props = $props();
</script>

<ToggleGroup.Root bind:value={mode} type="single" class="mt-1 flex items-center">
	<div class="flex items-center rounded-lg border border-gray-200 shadow">
		<ToggleGroup.Item
			aria-label="toggle and"
			value="and"
			class="flex items-center truncate  rounded-s-lg  bg-white px-1 py-0.5 text-xs text-gray-400 hover:bg-blue-100 data-[state=on]:bg-blue-500 data-[state=on]:font-bold data-[state=on]:text-white"
		>
			AND
		</ToggleGroup.Item>
		<ToggleGroup.Item
			aria-label="toggle or"
			value="or"
			class="flex items-center truncate  rounded-e-lg  bg-white px-1 py-0.5 text-xs text-gray-400 hover:bg-blue-100 data-[state=on]:bg-blue-500 data-[state=on]:font-bold data-[state=on]:text-white"
		>
			OR
		</ToggleGroup.Item>
	</div>
</ToggleGroup.Root>
