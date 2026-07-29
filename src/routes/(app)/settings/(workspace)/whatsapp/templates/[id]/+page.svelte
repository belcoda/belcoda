<script lang="ts">
	import { t } from '$lib/index.svelte';
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import CreateOrEditWhatsAppTemplate from '$lib/components/forms/whatsapp/templates/CreateOrEditWhatsAppTemplate.svelte';
	import {
		createDefaultTemplate,
		type ReadWhatsappTemplateZero
	} from '$lib/schema/whatsapp-template';
	import { appState } from '$lib/state.svelte';
	import { v7 as uuidv7 } from 'uuid';
	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';
	const { params } = $props();
	const template = $derived.by(() =>
		z.createQuery(queries.whatsappTemplate.read({ templateId: params.id }))
	);
</script>

<ContentLayout rootLink="/settings/whatsapp/templates">
	{#snippet header()}
		<div class="flex items-center justify-between">
			<h1 class="text-2xl font-bold" data-testid="whatsapp-template-edit-heading">
				{t`Edit WhatsApp template`}
			</h1>
		</div>
	{/snippet}
	{#if template.data}
		<CreateOrEditWhatsAppTemplate
			template={template.data as ReadWhatsappTemplateZero}
			mode="edit"
		/>
	{/if}
</ContentLayout>
