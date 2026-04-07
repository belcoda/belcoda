<script lang="ts">
	import { t } from '$lib/index.svelte';
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import PersonCreateOrUpdate from '$lib/components/forms/person/PersonCreateOrUpdate.svelte';
	import { goto } from '$app/navigation';
	async function onCreated(personId: string) {
		await goto(`/community/${personId}`);
	}
	import { Button } from '$lib/components/ui/button/index.js';
</script>

<ContentLayout rootLink="/community">
	{#snippet header()}
		<div class="flex items-center justify-between">
			<h1 class="text-2xl font-bold" data-testid="person-create-heading">{t`Create Person`}</h1>
		</div>
	{/snippet}

	<PersonCreateOrUpdate {onCreated} />

	{#snippet footer()}
		<div class="flex w-full justify-end gap-2">
			<Button href="/community" variant="outline" data-testid="person-form-cancel"
				>{t`Cancel`}</Button
			>
			<Button type="submit" form="person-form" data-testid="person-form-save">{t`Save`}</Button>
		</div>
	{/snippet}
</ContentLayout>
