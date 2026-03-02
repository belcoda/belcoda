<script lang="ts">
	import { ToggleGroup } from 'bits-ui';
	import { t } from '$lib/index.svelte';
	type Props = {
		mode: 'and' | 'or';
		onChange?: (mode: 'and' | 'or') => void | Promise<void>;
	};
	let { mode = $bindable('and'), onChange }: Props = $props();

	function getMode() {
		return mode;
	}
	function setMode(newMode: 'and' | 'or') {
		mode = newMode;
		onChange?.(newMode);
	}
</script>

<ToggleGroup.Root bind:value={getMode, setMode} type="single" class="mt-1 flex items-center">
	<div class="flex items-center rounded-lg border border-gray-200 shadow">
		<ToggleGroup.Item
			aria-label={t`toggle and`}
			value="and"
			class="flex items-center truncate  rounded-s-lg  bg-white px-1 py-0.5 text-xs text-gray-400 hover:bg-blue-100 data-[state=on]:bg-blue-500 data-[state=on]:font-bold data-[state=on]:text-white"
		>
			{t`AND`}
		</ToggleGroup.Item>
		<ToggleGroup.Item
			aria-label={t`toggle or`}
			value="or"
			class="flex items-center truncate  rounded-e-lg  bg-white px-1 py-0.5 text-xs text-gray-400 hover:bg-blue-100 data-[state=on]:bg-blue-500 data-[state=on]:font-bold data-[state=on]:text-white"
		>
			{t`OR`}
		</ToggleGroup.Item>
	</div>
</ToggleGroup.Root>
