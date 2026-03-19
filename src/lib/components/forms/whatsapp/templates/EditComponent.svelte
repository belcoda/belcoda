<script lang="ts">
	import { t } from '$lib/index.svelte';
	import { appState } from '$lib/state.svelte';
	import * as Alert from '$lib/components/ui/alert/index.js';

	import PlusIcon from '@lucide/svelte/icons/plus';
	import XIcon from '@lucide/svelte/icons/x';
	import { env } from '$env/dynamic/public';
	const { PUBLIC_HOST } = env;
	import { type TemplateMessageComponents } from '$lib/schema/whatsapp/template/index';
	import type { LanguageCode } from '$lib/utils/language';
	let {
		components = $bindable(),
		mode,
		templateName,
		templateLocale,
		templateId
	}: {
		components: TemplateMessageComponents;
		mode: 'edit' | 'create';
		templateName: string;
		templateLocale: LanguageCode;
		templateId: string;
	} = $props();
	const headerIndex: number = $derived(
		components.findIndex((component) => component?.type === 'HEADER')
	); //-1 if not found
	const bodyIndex: number = $derived(
		components.findIndex((component) => component?.type === 'BODY')
	); //should definitely be found
	const buttonsIndex: number = $derived(
		components.findIndex((component) => component?.type === 'BUTTONS')
	); //-1 if not found

	const numberOfButtons: number = $derived(
		components
			.filter((component) => component?.type === 'BUTTONS')
			.reduce((acc, curr) => acc + (curr?.buttons?.length || 0), 0)
	);

	import EditComponentText from './EditComponentText.svelte';
	import CroppedImageUpload from '$lib/components/ui/image-upload/CroppedImageUpload.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Select } from '$lib/components/ui/select/index.js';
	import LanguageSelect from '$lib/components/ui/custom-select/language/language.svelte';
	import { slugifyUnderscore } from '$lib/utils/slug';
	/* svelte-ignore state_referenced_locally */
	let name = $state(templateName);
	/* svelte-ignore state_referenced_locally */
	let locale = $state(templateLocale);

	function deleteButton(index: number) {
		if (components[buttonsIndex] && components[buttonsIndex].type === 'BUTTONS') {
			const newButtons = components[buttonsIndex].buttons.filter((_, i) => i !== index);
			components[buttonsIndex] = {
				...components[buttonsIndex],
				buttons: newButtons
			};
		}
	}

	import { v7 as uuidv7 } from 'uuid';
	import { z } from '$lib/zero.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import { goto } from '$app/navigation';

	import { updateWhatsappTemplate, createWhatsappTemplate } from '$lib/schema/whatsapp-template';
	import { safeParse, getDotPath } from 'valibot';
	let error: string | null = $state(null);

	async function saveTemplate() {
		error = null;

		if (mode === 'edit') {
			const parsed = safeParse(updateWhatsappTemplate, {
				components: $state.snapshot(components)
			});
			if (!parsed.success) {
				error = parsed.issues.map((issue) => `${getDotPath(issue)}: ${issue.message}`).join('\n');
				return;
			}
			if (!parsed.output.components) {
				error = t`Invalid template data. Please try again.`;
				return;
			}
			const template = z.mutate(
				mutators.whatsappTemplate.update({
					metadata: {
						organizationId: appState.organizationId,
						whatsappTemplateId: templateId
					},
					input: parsed.output
				})
			);
			await template.client;
			await goto('/settings/whatsapp/templates');
		} else {
			const parsed = safeParse(createWhatsappTemplate, {
				components: $state.snapshot(components)
			});
			if (!parsed.success) {
				error = parsed.issues.map((issue) => `${getDotPath(issue)}: ${issue.message}`).join('\n');
				return;
			}
			if (!parsed.output.components) {
				error = t`Invalid template data. Please try again.`;
				return;
			}
			const result = z.mutate(
				mutators.whatsappTemplate.create({
					metadata: {
						organizationId: appState.organizationId,
						whatsappTemplateId: templateId
					},
					input: parsed.output
				})
			);
			await result.client;
			await goto('/settings/whatsapp/templates');
		}
	}
</script>

<div class="flex flex-col">
	<div class="flex flex-col gap-2">
		<div class="grid grid-cols-1 gap-2">
			{#if error}
				<Alert.Root variant="destructive">
					<Alert.Title>{error}</Alert.Title>
				</Alert.Root>
			{/if}
			<Label>{t`Template name`}</Label>
			<Input bind:value={name} />
			<p class="text-sm text-gray-500">
				{t`Can only contain lowercase latin alphabet letters, numbers, and underscores.`}
			</p>
			<LanguageSelect bind:value={locale} />
		</div>
		<hr class="my-4 border-gray-200" />
		{#if headerIndex !== -1}
			{@render editHeaderContainer()}
		{:else}
			{@render createNewHeader()}
		{/if}
		{#if bodyIndex !== -1}
			{@render editBody()}
		{/if}
		{#if buttonsIndex !== -1}
			{@render editButtons()}
		{:else}
			{@render createButtons()}
		{/if}
		<div class="mt-4 flex items-center justify-end gap-2">
			<a class="btn" href="/settings/whatsapp/templates"> {t`Discard`} </a>
			<button class="btn-blue" onclick={saveTemplate}
				>{mode === 'edit' ? t`Save` : t`Create new template`}</button
			>
		</div>
	</div>
</div>

{#snippet createNewHeader()}
	<div class="flex h-40 w-full items-center justify-center">
		<div class="flex flex-col gap-2">
			<button
				class="btn flex items-center gap-2"
				onclick={() => {
					components.push({
						type: 'HEADER',
						format: 'TEXT',
						text: '',
						example: { header_text: [] }
					});
				}}><PlusIcon class="size-4" /> {t`Add text header`}</button
			>
			<button
				class="btn flex items-center gap-2"
				onclick={() => {
					components.push({
						type: 'HEADER',
						format: 'IMAGE',
						example: { header_url: [`${PUBLIC_HOST}/ui/placeholder.jpg`] }
					});
				}}><PlusIcon class="size-4" /> {t`Add image header`}</button
			>
		</div>
	</div>
{/snippet}

{#snippet editHeaderContainer()}
	<div>
		<div class="flex items-center justify-between">
			<h4 class="text-lg font-bold">{t`Header`}</h4>
			<div>
				<button
					class="cursor-pointer"
					onclick={() => {
						components.splice(headerIndex, 1);
					}}><XIcon class="size-4" /></button
				>
			</div>
		</div>
	</div>
	{#if components[headerIndex] && components[headerIndex].type === 'HEADER' && components[headerIndex].format === 'TEXT'}
		<div>
			<EditComponentText
				type="header"
				bind:value={components[headerIndex].text}
				bind:items={components[headerIndex].example.header_text}
			/>
		</div>
	{/if}
	{#if components[headerIndex] && components[headerIndex].type === 'HEADER' && components[headerIndex].format === 'IMAGE'}
		<Alert.Root>
			<Alert.Title>{t`Example image`}</Alert.Title>
			<Alert.Description
				>{t`Please upload an example of the kind of image you'll be using when you send messages using this template. This is useful for the template review process. When you actually send a message, you will be able to select a new image.`}</Alert.Description
			>
		</Alert.Root>

		<CroppedImageUpload
			onUpload={async (url) => {
				if (
					components[headerIndex] &&
					components[headerIndex].type === 'HEADER' &&
					components[headerIndex].format === 'IMAGE'
				) {
					components[headerIndex].example.header_url = [url];
				}
			}}
		/>
	{/if}
{/snippet}

{#snippet editBody()}
	{#if components[bodyIndex] && components[bodyIndex].type === 'BODY'}
		<h4 class="text-lg font-bold">{t`Body text`}</h4>
		<div>
			<EditComponentText
				type="body"
				bind:value={components[bodyIndex].text}
				bind:items={components[bodyIndex].example.body_text[0]}
			/>
		</div>
	{/if}
{/snippet}

{#snippet createButtons()}
	<div class="flex h-40 w-full items-center justify-center">
		<div class="flex flex-col gap-2">
			<button
				class="btn flex items-center gap-2"
				onclick={() => {
					components.push({
						type: 'BUTTONS',
						buttons: [{ type: 'QUICK_REPLY', text: '[Button text]' }]
					});
				}}><PlusIcon class="size-4" /> {t`Add buttons`}</button
			>
		</div>
	</div>
{/snippet}

{#snippet editButtons()}
	{#if components[buttonsIndex] && components[buttonsIndex].type === 'BUTTONS'}
		<div class="flex items-center justify-between">
			<h4 class="text-lg font-bold">{t`Buttons`}</h4>
			<div>
				<button
					class="cursor-pointer"
					onclick={() => {
						components.splice(headerIndex, 1);
					}}><XIcon class="size-4" /></button
				>
			</div>
		</div>
		<div class="flex flex-col gap-2">
			{#each components[buttonsIndex].buttons as _, index}
				<div class="flex items-center gap-4">
					<Input bind:value={components[buttonsIndex].buttons[index].text} />
					<button class="cursor-pointer" onclick={() => deleteButton(index)}
						><XIcon class="size-4" /></button
					>
				</div>
			{/each}
			{#if numberOfButtons < 9}
				<!-- Maximum 10 buttons per template  -->
				<div class="flex justify-end">
					<button
						class="btn flex items-center gap-2"
						onclick={() => {
							if (components[buttonsIndex] && components[buttonsIndex].type === 'BUTTONS') {
								components[buttonsIndex].buttons.push({ type: 'QUICK_REPLY', text: '' });
							}
						}}><PlusIcon class="size-4" /> {t`Add button`}</button
					>
				</div>
			{:else}
				<div class="flex justify-end">
					<p class="text-xs text-gray-500">{t`You can only add up to 10 buttons per template.`}</p>
				</div>
			{/if}
		</div>
	{/if}
{/snippet}
