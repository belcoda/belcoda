<script lang="ts">
	import { appState, getListFilter } from '$lib/state.svelte';
	import { t } from '$lib/index.svelte';
	import MultiSelect from 'svelte-multiselect'; //the component that handles the dropdown and the selected items (see https://multiselect.janosh.dev/)\

	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';

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
		}),
		onChange
	}: {
		disabled?: boolean;
		initialSelected?: FilterType[];
		filter?: FilterGroupType;
		onChange?: (filter: FilterGroupType) => void | Promise<void>;
	} = $props();

	import OptionComponent from '$lib/components/widgets/communications/recipients/Option.svelte';
	import AndOrToggle from '$lib/components/widgets/communications/recipients/AndOrToggle.svelte';
	import {
		getFilterType,
		getFilterOptionsByType
	} from '$lib/components/widgets/communications/recipients/getOptions.svelte';

	//filter state
	let searchString = $state('');
	let filterState = $state(getFilterType(''));
	const eventStatus = $derived.by(() => {
		if (filterState.type === 'eventAttended') {
			return 'attended';
		} else if (filterState.type === 'eventNoshow') {
			return 'noshow';
		} else {
			return 'any';
		}
	});

	//zero queries
	const personResults = $derived.by(() => {
		const listFilter = getListFilter(appState.organizationId, { searchString, pageSize: 5 });
		return z.createQuery(queries.person.list(listFilter));
	});

	const teamResults = $derived.by(() => {
		const listFilter = getListFilter(appState.organizationId, { searchString, pageSize: 5 });
		return z.createQuery(queries.team.list(listFilter));
	});

	const tagResults = $derived.by(() => {
		const listFilter = getListFilter(appState.organizationId, { searchString, pageSize: 5 });
		return z.createQuery(queries.tag.list(listFilter));
	});

	const eventResults = $derived.by(() => {
		const listFilter = getListFilter(appState.organizationId, { searchString, pageSize: 5 });
		return z.createQuery(queries.event.list(listFilter));
	});

	// return options for the multiselect
	const options = $derived.by(() => {
		const returnArr = [];
		if (filterState.type === 'default') {
			returnArr.push(
				...[
					...personResults.data?.map((person) => ({
						type: 'personId' as const,
						personId: person.id,
						givenName: person.givenName,
						familyName: person.familyName,
						profilePicture: person.profilePicture,
						label: `${person.givenName} ${person.familyName}`
					})),
					...teamResults.data?.map((team) => ({
						type: 'teamId' as const,
						teamId: team.id,
						name: team.name,
						label: `${team.name}`
					})),
					...tagResults.data?.map((tag) => ({
						type: 'hasTag' as const,
						tagId: tag.id,
						name: tag.name,
						label: `${tag.name}`
					})),
					...eventResults.data?.map((event) => {
						const suffix = eventStatus === 'any' ? '' : ` (${eventStatus})`;
						return {
							type: 'eventSignup' as const,
							eventId: event.id,
							status: eventStatus as 'any' | 'signup' | 'attended' | 'noshow',
							label: `${event.title}${suffix}`
						};
					}),
					{
						type: 'everyone' as const,
						label: t`Everyone`
					}
				]
			);
		} else {
			const optionsArr = getFilterOptionsByType(filterState);
			returnArr.push(...optionsArr);
		}
		return returnArr;
	});

	function getSelected() {
		return filter.filters;
	}

	function setSelected(selected: FilterType[]) {
		filter.filters = selected.map((s) => ({ ...s }));
		onChange?.(filter);
	}

	function getSearchString() {
		return searchString;
	}

	function setSearchString(value: string) {
		filterState = getFilterType(value);
		searchString = value;
	}
</script>

<MultiSelect
	{disabled}
	{options}
	bind:searchText={getSearchString, setSearchString}
	bind:selected={getSelected, setSelected}
	filterFunc={(opt, searchText) => {
		return opt.label.toLowerCase().includes(filterState.searchString.toLowerCase());
	}}
	placeholder={t`Recipients`}
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
		<AndOrToggle bind:mode={filter.type} onChange={() => onChange?.(filter)} />
	{/if}
</div>
