<script lang="ts">
	import { type ReadWhatsappTemplateZero } from '$lib/schema/whatsapp-template';
	import type { LanguageCode } from '$lib/utils/language';
	const { template, mode }: { template: ReadWhatsappTemplateZero; mode: 'edit' | 'create' } =
		$props();
	let components = $state((() => template.components)());
	import EditComponents from './EditComponent.svelte';
	import TemplateRender from './TemplateRender.svelte';
</script>

<div class="relative mt-4 grid grid-cols-2 gap-4">
	<EditComponents
		templateId={template.id}
		bind:components
		{mode}
		templateName={template.name}
		templateLocale={template.locale as LanguageCode}
	/>
	<TemplateRender {components} />
</div>
