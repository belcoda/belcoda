<script lang="ts">
	import { appState } from '$lib/state.svelte';
	import MultiSelect from 'svelte-multiselect'; //the component that handles the dropdown and the selected items (see https://multiselect.janosh.dev/)\
	import {
		type FilterGroupType,
		type FilterType,
		defaultFilterGroup
	} from '$lib/schema/person/filter';
	const {
		initialSelected = [],
		disabled = false,
		filter = $bindable({
			...defaultFilterGroup,
			filters: initialSelected
		})
	}: {
		disabled?: boolean;
		initialSelected?: FilterType[];
		filter?: FilterGroupType;
	} = $props();

	import OptionComponent from '$lib/components/widgets/communications/recipients/Option.svelte';
	import AndOrToggle from '$lib/components/widgets/communications/recipients/AndOrToggle.svelte';
	import { buildGetOptions } from '$lib/components/widgets/communications/recipients/getOptions.svelte';
	const getOptions = buildGetOptions(appState.organizationId);

	let searchText = $state('');
	import { Debounced } from 'runed';
	const options = $derived.by(
		() => new Debounced(() => getOptions({ search: searchText }), 200).current
	);

	function getSelected() {
		return filter.filters;
	}

	function setSelected(selected: FilterType[]) {
		filter.filters = selected;
	}
</script>

<MultiSelect
	{disabled}
	options={options.options}
	bind:searchText
	bind:selected={getSelected, setSelected}
	filterFunc={(opt, searchText) => {
		return opt.label.toLowerCase().includes(searchText.toLowerCase());
	}}
	placeholder="Recipients"
	--sms-options-bg="white"
	--sms-options-border="1px solid #e0e0e0"
	--sms-bg="white"
	--sms-border="1px solid #e0e0e0"
	--sms-placeholder-color="#aaaaaa"
	--sms-border-radius="8px"
	--sms-padding="4px 10px"
	--sms-font-size="14px"
	--sms-selected-bg="linear-gradient(to bottom right,#f1f5f9,#e7e5e4)"
	--sms-remove-btn-hover-color="#434343"
	--sms-remove-btn-hover-bg="#cccccc"
	--sms-li-active-bg="#f1f5f9"
	outerDivClass="shadow-sm w-full focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]"
	ulOptionsClass="shadow-sm"
	inputClass="placeholder:text-muted-foreground"
	liSelectedClass="border border-gray-200"
>
	{#snippet expandIcon({ open })}
		&nbsp;
	{/snippet}
	{#snippet option({ option })}
		<OptionComponent filter={option} />
	{/snippet}
	{#snippet selectedItem({ option })}
		<OptionComponent filter={option} />
	{/snippet}
</MultiSelect>
<div class="flex items-center justify-end">
	{#if filter.filters.length > 1}
		<AndOrToggle bind:mode={filter.type} />
	{/if}
</div>
