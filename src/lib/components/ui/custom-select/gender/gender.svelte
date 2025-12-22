<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js';

	import {
		genderSelectOptions as genderOptions,
		type GenderOption as GenderOption
	} from '$lib/utils/person';
	let {
		value = $bindable(),
		class: className,
		...props
	}: { value: GenderOption; class?: string } = $props();
	import { cn } from '$lib/utils.js';
</script>

<Select.Root type="single" bind:value {...props}>
	<Select.Trigger class={cn('w-full justify-between', className)}>
		{value ? genderOptions.find((option) => option.value === value)?.label : 'Select a gender'}
	</Select.Trigger>
	<Select.Content>
		{#each genderOptions as option}
			<Select.Item value={option.value} label={option.label} />
		{/each}
	</Select.Content>
</Select.Root>
