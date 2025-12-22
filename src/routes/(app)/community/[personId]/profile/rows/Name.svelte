<script lang="ts">
	import { type ReadPersonZero } from '$lib/schema/person';

	let { person }: { person: ReadPersonZero } = $props();
	let edit = $state(false);
	import { Button } from '$lib/components/ui/button/index.js';
	import NameForm from './form/Name.svelte';
</script>

<div class="my-8">
	{#if edit}
		<NameForm bind:edit {person} />
	{:else}
		<div class="text-center text-xl font-medium">
			{person.givenName}
			{person.familyName}
		</div>
	{/if}

	{#if !edit}
		<div class="mt-4 flex justify-center">
			<Button size="sm" variant="outline" onclick={() => (edit = true)}>Edit</Button>
		</div>
	{/if}
</div>
