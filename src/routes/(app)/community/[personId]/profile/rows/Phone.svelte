<script lang="ts">
	import ProfileRow from '../ProfileRow.svelte';
	import PhoneForm from './form/Phone.svelte';
	import { type ReadPersonZero } from '$lib/schema/person';
	import { renderLocalPhoneNumber, safeGetCountryCodeFromPhoneNumber } from '$lib/utils/phone';
	let { person }: { person: ReadPersonZero } = $props();
	let edit = $state(false);
	import ColorBadge from '$lib/components/ui/colorbadge/badge.svelte';
</script>

<ProfileRow
	title="Phone"
	separator={true}
	showCopyButton={true}
	copyText={person.phoneNumber}
	bind:edit
>
	{#if edit}
		<PhoneForm bind:edit {person} />
	{:else if person.phoneNumber}
		<div class="flex items-center gap-2">
			{#if safeGetCountryCodeFromPhoneNumber(person.phoneNumber)}
				<img
					src={`/images/icons/flags/svg/${safeGetCountryCodeFromPhoneNumber(person.phoneNumber)}.svg`}
					alt={safeGetCountryCodeFromPhoneNumber(person.phoneNumber)}
					class="size-4"
				/>
			{/if}
			{renderLocalPhoneNumber(person.phoneNumber, person.country)}
		</div>
		<div class="mt-2 flex items-center gap-2">
			{#if person.subscribed}
				<ColorBadge color="green">Subscribed</ColorBadge>
			{/if}
			{#if person.doNotContact}
				<ColorBadge color="red">Do not contact</ColorBadge>
			{/if}
		</div>
	{:else}
		<div class="text-muted-foreground italic">Not specified</div>
	{/if}
</ProfileRow>
