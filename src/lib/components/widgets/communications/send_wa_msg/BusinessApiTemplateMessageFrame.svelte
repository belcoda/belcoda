<script lang="ts">
	import type { ReadWhatsappTemplateZero } from '$lib/schema/whatsapp-template';
	import type { WhatsappTemplateStatus } from '$lib/schema/whatsapp/template/status';
	import { appState, getListFilter } from '$lib/state.svelte';
	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';

	let filter = $derived({
		...getListFilter(appState.organizationId),
		statusIn: ['APPROVED'] as WhatsappTemplateStatus[]
	});
	const allApprovedTemplates = $derived.by(() => {
		return z.createQuery(queries.whatsappTemplate.list(filter));
	});

	//filter out all templates that DO HAVE buttons (we can't send button templates with a single message with no actions/automations)
	const filteredTemplates = $derived(
		allApprovedTemplates.data?.filter((t) => !t.components.some((c) => c.type === 'BUTTONS'))
	);

	//if defaultTemplateId is part of the filteredTemplates, use that, otherwise use the first template
	const template = $derived(
		filteredTemplates.find(
			(t) => t.id === appState.activeOrganization?.data?.settings.whatsApp.defaultTemplateId
		) ?? filteredTemplates[0]
	);
</script>

<div>
	<h1>{template.name}</h1>
</div>
