<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import { Input } from '$lib/components/ui/input/index.js';

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		fallbackValue = undefined,
		...restProps
	}: ComponentProps<typeof Input> & { fallbackValue?: undefined | null } = $props();
	function getValue() {
		return value;
	}
	function setValue(newValue: string) {
		if (newValue === '') {
			value = fallbackValue;
		} else {
			value = newValue;
		}
	}
</script>

<Input {ref} bind:value={getValue, setValue} class={className} {...restProps} />
