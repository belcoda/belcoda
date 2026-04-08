<script lang="ts">
	import ProfileRow from '../ProfileRow.svelte';
	import EmailForm from './form/Email.svelte';
	import { type ReadPersonZero } from '$lib/schema/person';
	let { person }: { person: ReadPersonZero } = $props();
	let edit = $state(false);
	import ColorBadge from '$lib/components/ui/colorbadge/badge.svelte';
	import { t } from '$lib/index.svelte';
</script>

<ProfileRow
	title={t`Email`}
	separator={true}
	showCopyButton={true}
	copyText={person.emailAddress}
	editTestId="person-profile-email-edit-btn"
	bind:edit
>
	{#if edit}
		<EmailForm bind:edit {person} />
	{:else if person.emailAddress}
		<span data-testid="person-profile-email-display">{person.emailAddress}</span>
		<div class="mt-2 flex items-center gap-2">
			{#if person.subscribed}
				<ColorBadge color="green">{t`Subscribed`}</ColorBadge>
			{/if}
			{#if person.doNotContact}
				<ColorBadge color="red">{t`Do not contact`}</ColorBadge>
			{/if}
		</div>
	{:else}
		<div class="text-muted-foreground italic">{t`Not specified`}</div>
	{/if}
</ProfileRow>
