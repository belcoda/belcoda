<script lang="ts">
	import { type ReadPersonZero } from '$lib/schema/person';

	let { person }: { person: ReadPersonZero } = $props();
	let edit = $state(false);
	import { Button } from '$lib/components/ui/button/index.js';
	import NameForm from './form/Name.svelte';
	import { t } from '$lib/index.svelte';
	import { renderName } from '$lib/utils/name';
</script>

<div class="my-8">
	{#if edit}
		<NameForm bind:edit {person} />
	{:else}
		<div class="text-center text-xl font-medium" data-testid="person-profile-name-display">
			{renderName({
				givenName: person.givenName,
				familyName: person.familyName,
				country: person.country
			})}
		</div>
	{/if}

	{#if !edit}
		<div class="mt-4 flex justify-center">
			<Button
				size="sm"
				variant="outline"
				onclick={() => (edit = true)}
				data-testid="person-profile-name-edit-btn">{t`Edit`}</Button
			>
		</div>
	{/if}
</div>
