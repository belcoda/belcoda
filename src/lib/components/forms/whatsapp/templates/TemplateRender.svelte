<script lang="ts">
	import { type TemplateMessageComponents } from '$lib/schema/whatsapp/template/index';

	const { components }: { components: TemplateMessageComponents } = $props();
	const header = $derived(components.find((component) => component?.type === 'HEADER'));
	const body = $derived(components.find((component) => component?.type === 'BODY'));
	const buttons = $derived(components.find((component) => component?.type === 'BUTTONS'));

	import { stripHtmlTags } from '$lib/utils/html';
	function renderBodyTexts(text: string) {
		const stripped = stripHtmlTags(text);
		const replaced = stripped.replace(/\n/g, '<br />');
		//replace all {{variables}} with a badge span with the text inside
		const variables = replaced.replace(/{{[1-9]}}/g, (match) => {
			return `<span class="bg-blue-100 select-none px-1 py-0.5 rounded-md font-medium">${match}</span>`;
		});
		return variables;
	}
</script>

<div>
	<div
		class="relative mx-auto h-[600px] w-[300px] rounded-[2.5rem] border-14 border-gray-800 bg-gray-800 dark:border-gray-800"
	>
		<div
			class="absolute -start-[17px] top-[72px] h-[32px] w-[3px] rounded-s-lg bg-gray-800 dark:bg-gray-800"
		></div>
		<div
			class="absolute -start-[17px] top-[124px] h-[46px] w-[3px] rounded-s-lg bg-gray-800 dark:bg-gray-800"
		></div>
		<div
			class="absolute -start-[17px] top-[178px] h-[46px] w-[3px] rounded-s-lg bg-gray-800 dark:bg-gray-800"
		></div>
		<div
			class="absolute -end-[17px] top-[142px] h-[64px] w-[3px] rounded-e-lg bg-gray-800 dark:bg-gray-800"
		></div>
		<div class="h-[572px] w-[272px] overflow-hidden rounded-4xl bg-stone-300 px-4 py-8">
			<div class="max-w-4/5 rounded-lg rounded-b-lg bg-white text-sm text-gray-700">
				{#if header}
					{#if header.format === 'TEXT'}
						<div class="mb-1 px-2 pt-2 font-semibold">
							{@html renderBodyTexts(header.text)}
						</div>
					{:else if header.format === 'IMAGE'}
						{#if header.example?.header_url && Array.isArray(header.example.header_url) && header.example.header_url.length > 0}
							<img
								src={header.example.header_url[0]}
								alt="Header"
								class="h-auto w-full rounded-t-lg"
							/>
						{/if}
					{/if}
				{/if}
				{#if body}
					<div class="min-h-6 px-2 pt-1 pb-2">{@html renderBodyTexts(body.text)}</div>
				{/if}
				{#if buttons}
					<div class="divide-y divide-gray-100 border-t border-gray-100">
						{#each buttons.buttons as button}
							<div class="py-1.5 text-center">
								<div class="px-2 font-medium text-gray-600">{button.text}</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
