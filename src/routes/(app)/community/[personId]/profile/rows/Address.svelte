<script lang="ts">
	import { personSchema, type ReadPersonZero } from '$lib/schema/person';

	import { type CountryCode } from '$lib/schema/helpers';
	import { renderLocalizedCountryName } from '$lib/utils/country';
	let { person }: { person: ReadPersonZero } = $props();
	import { renderAddress } from '$lib/utils/string/address';
	import { appState } from '$lib/state.svelte';
	import AddressForm from './form/Address.svelte';
	import ProfileRow from '../ProfileRow.svelte';
	let edit = $state(false);
</script>

<ProfileRow
	bind:edit
	title="Address"
	separator={true}
	showCopyButton={true}
	copyText={renderAddress({
		addressLine1: person.addressLine1,
		addressLine2: person.addressLine2,
		locality: person.locality,
		region: person.region,
		postcode: person.postcode,
		country: person.country,
		locale: appState.locale
	})}
>
	{#if edit}
		<AddressForm bind:edit {person} />
	{:else}
		{#if person.addressLine1}<div class="line-clamp-1">
				{person.addressLine1}
			</div>{/if}

		{#if person.addressLine2}
			<div class="line-clamp-1">{person.addressLine2}</div>
		{/if}
		{#if [person.locality, person.region].filter(Boolean).join(', ') !== ''}
			<div class="line-clamp-1">
				{[person.locality, person.region].filter(Boolean).join(', ')}
			</div>
		{/if}

		<div class="line-clamp-1">
			{renderLocalizedCountryName(person.country as CountryCode, appState.locale)}
			{person.postcode}
		</div>
	{/if}
</ProfileRow>
