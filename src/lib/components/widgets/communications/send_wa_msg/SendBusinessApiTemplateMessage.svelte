<script lang="ts">
	import type { ReadWhatsappTemplateZero } from '$lib/schema/whatsapp-template';
	const { template }: { template: ReadWhatsappTemplateZero } = $props();
	const header = $derived(template.components.find((c) => c.type === 'HEADER'));
	const body = $derived(template.components.find((c) => c.type === 'BODY'));
	const buttons = $derived(template.components.find((c) => c.type === 'BUTTONS'));
</script>

<div>
	<h1>{template.name}</h1>
	{#if header}
		<div>
			<h2>Header</h2>
			<p>{header.format === 'TEXT' ? header.text : header.example?.header_url?.[0]}</p>
		</div>
	{/if}
	{#if body}
		<div>
			<h2>Body</h2>
			<p>{body.text}</p>
		</div>
	{/if}
	{#if buttons}
		<div>
			<h2>Buttons</h2>
			<ul>
				{#each buttons.buttons as button}
					<li>{button.text}</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>
