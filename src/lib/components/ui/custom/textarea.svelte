<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import { Textarea } from '$lib/components/ui/textarea/index.js';

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		fallbackValue = undefined,
		...restProps
	}: ComponentProps<typeof Textarea> & { fallbackValue?: undefined | null } = $props();
	function getValue() {
		if (typeof value === 'string') {
			return value;
		} else {
			return '';
		}
	}
	function setValue(newValue: string) {
		if (newValue === '') {
			value = fallbackValue;
		} else {
			value = newValue;
		}
	}
</script>

<Textarea {ref} bind:value={getValue, setValue} class={className} {...restProps} />
