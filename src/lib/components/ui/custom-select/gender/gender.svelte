<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js';

	import {
		getGenderSelectOptions,
		type GenderOption as GenderOption
	} from '$lib/utils/person';
	
	const genderOptions = getGenderSelectOptions();
	let {
		value = $bindable(),
		class: className,
		...props
	}: { value: GenderOption; class?: string } = $props();
	import { cn } from '$lib/utils.js';
	import { t } from '$lib/index.svelte';
</script>

<Select.Root type="single" bind:value {...props}>
	<Select.Trigger class={cn('w-full justify-between font-medium', className)}>
		{value ? genderOptions.find((option) => option.value === value)?.label : t`Select a gender`}
	</Select.Trigger>
	<Select.Content>
		{#each genderOptions as option}
			<Select.Item value={option.value} label={option.label} />
		{/each}
	</Select.Content>
</Select.Root>
