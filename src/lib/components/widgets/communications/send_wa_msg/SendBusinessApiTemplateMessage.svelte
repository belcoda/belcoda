<script lang="ts">
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { WhatsappTemplateMessageData } from '$lib/schema/flow/index';
	import type { ReadWhatsappTemplateZero } from '$lib/schema/whatsapp-template';
	import type { TemplateParamSource } from '$lib/schema/template-variables';
	import CroppedImageUpload from '$lib/components/ui/image-upload/CroppedImageUpload.svelte';
	import TemplateVariablePicker from '$lib/components/templates/TemplateVariablePicker.svelte';
	import { t } from '$lib/index.svelte';
	import { parseTemplate } from '$lib/components/flow/nodes/template/parseTemplate';
	import {
		applyTemplateDefaults,
		buildNodeData,
		cloneTemplateMessageData,
		getParamDisplayValue,
		getParamSource,
		patchParamSource,
		patchParamSourceType,
		getVariableLabel
	} from '$lib/components/flow/nodes/template-message-form';

	let {
		template,
		data = $bindable()
	}: {
		template: ReadWhatsappTemplateZero;
		data: WhatsappTemplateMessageData;
	} = $props();

	const initial = cloneTemplateMessageData(data);
	let templateId = $state(initial.templateId);
	let headerParams = $state(initial.headerParams);
	let bodyParams = $state(initial.bodyParams);
	let headerImageUrl = $state(initial.headerImageUrl);

	let hydratedForTemplateId = $state<string | null>(null);

	const savedDataOnMount = (() => data)();
	const savedTemplateIdOnMount = savedDataOnMount.templateId;
	const hasSavedParams = Boolean(
		(savedDataOnMount.body?.templateParams?.length ?? 0) > 0 ||
			(savedDataOnMount.header?.templateParams?.length ?? 0) > 0 ||
			(savedDataOnMount.body?.templateStrings?.length ?? 0) > 0 ||
			(savedDataOnMount.header?.templateStrings?.length ?? 0) > 0
	);

	function commit() {
		data = buildNodeData({
			templateId,
			headerParams,
			bodyParams,
			buttons: [],
			headerImageUrl
		});
	}

	const templateHeader = $derived(template.components.find((c) => c.type === 'HEADER'));
	const templateBody = $derived(template.components.find((c) => c.type === 'BODY'));

	function hydrateFromData() {
		const id = template.id;

		const mergeExisting =
			hasSavedParams && savedTemplateIdOnMount === id && hydratedForTemplateId === null;

		const next = applyTemplateDefaults(
			{ templateId: id, headerParams, bodyParams, buttons: [], headerImageUrl },
			template.components,
			{ mergeExisting }
		);
		templateId = next.templateId;
		headerParams = next.headerParams;
		bodyParams = next.bodyParams;
		headerImageUrl = next.headerImageUrl;
		hydratedForTemplateId = id;
		commit();
	}

	const header = $derived.by(() => {
		if (templateHeader?.format === 'TEXT') {
			return parseTemplate(templateHeader.text ?? '');
		}
		return null;
	});
	const body = $derived(parseTemplate(templateBody?.text ?? ''));
	const bodyTokens = $derived(body.filter((token) => token.type === 'var'));

	function getTokenArrayIndex(token: number) {
		return bodyTokens.findIndex((t) => t.id === token);
	}

	function patchHeaderParam(index: number, source: TemplateParamSource) {
		headerParams = patchParamSource(headerParams, index, source);
		commit();
	}

	function patchBodyParam(index: number, source: TemplateParamSource) {
		bodyParams = patchParamSource(bodyParams, index, source);
		commit();
	}

	import { onMount } from 'svelte';
	onMount(() => {
		hydrateFromData();
	});
</script>

<div class="w-full rounded-md border border-input bg-gray-50 shadow-xs">
	{#if templateHeader && templateHeader.format === 'IMAGE'}
		<div class="border-b border-input px-3 pt-3 pb-3">
			<CroppedImageUpload
				class="w-full p-0"
				fileUrl={headerImageUrl}
				onUpload={async (url) => {
					headerImageUrl = url;
					commit();
				}}
			/>
		</div>
	{/if}

	<div class="min-h-16 px-3 py-3 text-sm whitespace-pre-wrap">
		{#if templateHeader && templateHeader.format === 'TEXT' && header}
			<div class="mb-2 font-medium">
				{#each header as item, i (i)}
					{#if item.type === 'text'}
						<span>{item.value}</span>
					{:else}
						<Popover.Root>
							<Popover.Trigger class="inline-block">
								{#snippet child({ props })}
									<span
										{...props}
										class="rounded-sm bg-blue-600/90 px-2 py-0.5 text-sm font-medium text-white outline-none"
										>{getParamDisplayValue(headerParams, 0, `{{${item.id}}}`)}</span
									>
								{/snippet}
							</Popover.Trigger>
							<Popover.Content class="w-80 bg-none">
								{@render paramSourceEditor('header', 0)}
							</Popover.Content>
						</Popover.Root>
					{/if}
				{/each}
			</div>
		{/if}

		{#if body.length > 0}
			{#each body as item, i (i)}
				{#if item.type === 'text'}
					<span>{item.value}</span>
				{:else}
					<Popover.Root>
						<Popover.Trigger class="inline-block">
							{#snippet child({ props })}
								<span
									{...props}
									class="rounded-sm bg-blue-600/90 px-2 py-0.5 text-sm font-medium text-white outline-none"
									>{getParamDisplayValue(
										bodyParams,
										getTokenArrayIndex(item.id),
										`{{${item.id}}}`
									)}</span
								>
							{/snippet}
						</Popover.Trigger>
						<Popover.Content class="w-80 bg-none">
							{@render paramSourceEditor('body', getTokenArrayIndex(item.id))}
						</Popover.Content>
					</Popover.Root>
				{/if}
			{/each}
		{/if}
	</div>
</div>

{#snippet paramSourceEditor(region: 'header' | 'body', index: number)}
	{@const params = region === 'header' ? headerParams : bodyParams}
	{@const source = getParamSource(params, index)}
	<div class="space-y-3">
		<div class="flex gap-2">
			<Button
				size="sm"
				variant={source.type === 'literal' ? 'default' : 'outline'}
				onclick={() => {
					if (region === 'header') {
						headerParams = patchParamSourceType(headerParams, index, 'literal');
					} else {
						bodyParams = patchParamSourceType(bodyParams, index, 'literal');
					}
					commit();
				}}
			>
				{t`Text`}
			</Button>
			<Button
				size="sm"
				variant={source.type === 'variable' ? 'default' : 'outline'}
				onclick={() => {
					if (region === 'header') {
						headerParams = patchParamSourceType(headerParams, index, 'variable');
					} else {
						bodyParams = patchParamSourceType(bodyParams, index, 'variable');
					}
					commit();
				}}
			>
				{t`Variable`}
			</Button>
		</div>

		{#if source.type === 'literal'}
			<Input
				value={source.value}
				oninput={(event) => {
					const value = event.currentTarget.value;
					if (region === 'header') {
						patchHeaderParam(index, { type: 'literal', value });
					} else {
						patchBodyParam(index, { type: 'literal', value });
					}
				}}
			/>
		{:else}
			<div class="space-y-2">
				<div class="flex items-center gap-2">
					<TemplateVariablePicker
						triggerLabel={t`Variable`}
						onSelect={(_, variable) => {
							const next = {
								type: 'variable' as const,
								key: variable.key,
								fallback: source.fallback
							};
							if (region === 'header') {
								patchHeaderParam(index, next);
							} else {
								patchBodyParam(index, next);
							}
						}}
					/>
					<span class="truncate text-sm text-muted-foreground">
						{getVariableLabel(source.key)}
					</span>
				</div>
				<Input
					placeholder={t`Fallback text`}
					value={source.fallback ?? ''}
					oninput={(event) => {
						const fallback = event.currentTarget.value;
						const next = {
							type: 'variable' as const,
							key: source.type === 'variable' ? source.key : ('person.given_name' as const),
							fallback
						};
						if (region === 'header') {
							patchHeaderParam(index, next);
						} else {
							patchBodyParam(index, next);
						}
					}}
				/>
				{#if !source.fallback?.trim()}
					<div
						class="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900"
					>
						<TriangleAlertIcon class="mt-0.5 size-3.5 shrink-0" />
						<span>{t`Add fallback text for recipients without this value.`}</span>
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/snippet}
