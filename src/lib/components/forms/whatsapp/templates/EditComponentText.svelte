<script lang="ts">
	import { t } from '$lib/index.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import XIcon from '@lucide/svelte/icons/x';

	import { watch } from 'runed';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { type TemplateMessageComponents } from '$lib/schema/whatsapp/template/index';
	let {
		components,
		type,
		index
	}: { components: TemplateMessageComponents; type: 'header' | 'body'; index: number } = $props();

	function syncVariablesWithValueString(value: string, variables: string[]): string[] {
		// Extract all unique {{param_name}} patterns from the string
		const matches = Array.from(new Set([...value.matchAll(/{{([1-9])}}/g)].map((m) => m[1])));

		// Ensure matches and variables arrays are the same length
		while (variables.length < matches.length) {
			variables.push(''); // Add empty strings for any missing variables
		}
		// Trim variables array if longer than matches
		if (variables.length > matches.length) {
			variables.length = matches.length;
		}

		// If type is header, only keep the first variable
		if (type === 'header' && variables.length > 1) {
			variables = [variables[0]];
		}

		return variables;
	}

	watch(
		() => value,
		() => {
			items = syncVariablesWithValueString(value, items);
		}
	);

	function addNewVariable() {
		if (type === 'header' && items.length >= 1) {
			return; // Don't add more variables for header type
		}
		value = value + `{{${(items?.length ?? 0) + 1}}}`;
		items.push('');
	}

	function deleteVariable(index: number) {
		const variableToRemove = index + 1;
		// Remove the variable from the value string
		value = value.replace(`{{${variableToRemove}}}`, '');
		// Remove the variable from items array
		items.splice(index, 1);
	}

	function getValue() {
		return value;
	}
	function setValue(incomingValue: string) {
		value = incomingValue;
		items = syncVariablesWithValueString(value, items);
	}

	import * as Alert from '$lib/components/ui/alert/index.js';
</script>

<div class="w-full">
	<div>
		<Textarea
			bind:value={getValue, setValue}
			maxlength={type === 'header' ? 60 : 1024}
			class="block w-full"
		></Textarea>
		<div class="ms-1 text-sm text-gray-500">
			{type === 'header'
				? t`The header text must be 60 characters or less`
				: t`The body text must be 1024 characters or less`}
		</div>
	</div>
	<div class="mt-2">
		{@render variablesTable(items)}
	</div>
</div>

{#snippet variablesTable(items: string[])}
	<div class="relative w-full overflow-x-auto">
		<div class="mb-2 flex items-center justify-end gap-2">
			{#if type === 'header' && items.length >= 1}
				<span class="text-sm text-gray-500">{t`Template headers can only have 1 variable`}</span>
			{/if}
			<Button
				onclick={addNewVariable}
				variant="outline"
				size="sm"
				disabled={type === 'header' && items.length >= 1}
			>
				{t`Add variable`}
			</Button>
		</div>
		{#if items.length > 0}
			<Alert.Root>
				<Alert.Title>{t`Example values`}</Alert.Title>
				<Alert.Description
					>{t`Provide examples of the values you might use in your templates. These will be used in the WhatsApp template review process. You will be able to change these values when you send a message.`}</Alert.Description
				>
			</Alert.Root>
		{:else}
			<Alert.Root>
				<Alert.Title>{t`Variables`}</Alert.Title>
				<Alert.Description
					>{t`Variables are placeholders for dynamic values that will be replaced with actual values when you send a message. You can add variables using the "Add new variable" button or by typing text in double curly brackets.`}</Alert.Description
				>
			</Alert.Root>
		{/if}
		<table class="w-full text-left text-sm rtl:text-right">
			<tbody>
				{#each items as _, i}
					<tr class="border-b border-gray-200">
						<th scope="row" class="px-6 py-2 font-medium whitespace-nowrap text-gray-900">
							{`{{${i + 1}}}`}
						</th>
						<td class="px-6 py-2">
							<Input bind:value={items[i]} />
						</td>
						<td class="px-6 py-2">
							<Button
								onclick={() => deleteVariable(i)}
								aria-label={t`Delete variable`}
								size="icon-sm"
								variant="ghost"
								title={t`Delete variable`}
							>
								<XIcon class="size-4" />
							</Button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/snippet}
