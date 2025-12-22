<script lang="ts">
	import ProfileRow from '../ProfileRow.svelte';
	import EmailForm from './form/Email.svelte';
	import { type ReadPersonZero } from '$lib/schema/person';
	let { person }: { person: ReadPersonZero } = $props();
	let edit = $state(false);
	import ColorBadge from '$lib/components/ui/colorbadge/badge.svelte';
</script>

<ProfileRow
	title="Email"
	separator={true}
	showCopyButton={true}
	copyText={person.emailAddress}
	bind:edit
>
	{#if edit}
		<EmailForm bind:edit {person} />
	{:else if person.emailAddress}
		{person.emailAddress}
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
