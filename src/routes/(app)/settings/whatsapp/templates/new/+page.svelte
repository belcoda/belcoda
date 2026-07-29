<script lang="ts">
	import { t } from '$lib/index.svelte';
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import CreateOrEditWhatsAppTemplate from '$lib/components/forms/whatsapp/templates/CreateOrEditWhatsAppTemplate.svelte';
	import { createDefaultTemplate } from '$lib/schema/whatsapp-template';
	import { appState } from '$lib/state.svelte';
	import { v7 as uuidv7 } from 'uuid';

	const template = $state(
		createDefaultTemplate({
			organizationId: appState.organizationId,
			id: uuidv7()
		})
	);
</script>

<ContentLayout rootLink="/settings/whatsapp/templates">
	{#snippet header()}
		<div class="flex items-center justify-between">
			<h1 class="text-2xl font-bold" data-testid="whatsapp-template-new-heading">
				{t`New WhatsApp template`}
			</h1>
		</div>
	{/snippet}
	<CreateOrEditWhatsAppTemplate {template} mode="create" />
</ContentLayout>
