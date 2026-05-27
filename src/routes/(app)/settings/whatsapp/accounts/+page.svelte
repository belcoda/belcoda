<script lang="ts">
	import { t } from '$lib/index.svelte';
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import EmbeddedFlow from './EmbeddedFlow.svelte';
	import BusinessProfile from './BusinessProfile.svelte';
	import { appState } from '$lib/state.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const whatsappConfigured = $derived(
		Boolean(
			appState.activeOrganization?.data?.settings.whatsApp.wabaId &&
				appState.activeOrganization?.data?.settings.whatsApp.number
		)
	);
</script>

<ContentLayout rootLink="/settings">
	{#snippet header()}
		<div class="flex items-center justify-between">
			<h1 class="text-2xl font-bold" data-testid="whatsapp-accounts-heading">
				{t`WhatsApp Business Account`}
			</h1>
		</div>
	{/snippet}
	<EmbeddedFlow mockExternalServices={data.mockExternalServices} />
	{#if whatsappConfigured}
		<BusinessProfile />
	{/if}
</ContentLayout>
