<script lang="ts">
	import { v4 as uuidv4 } from 'uuid';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import {
		Position,
		useSvelteFlow,
		type NodeProps,
		useStore,
		Handle,
		useNodes,
		type Node,
		NodeToolbar,
		useUpdateNodeInternals
	} from '@xyflow/svelte';
	import TrashIcon from '@lucide/svelte/icons/trash';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { WhatsappTemplateMessageData } from '$lib/schema/flow/index';
	import type { TemplateParamSource } from '$lib/schema/template-variables';
	import CroppedImageUpload from '$lib/components/ui/image-upload/CroppedImageUpload.svelte';
	import TemplateVariablePicker from '$lib/components/templates/TemplateVariablePicker.svelte';
	import { t } from '$lib/index.svelte';
	import { taint } from '$lib/components/flow/flow_state.svelte';
	import Combobox from './template/Combobox.svelte';
	import { parseTemplate } from './template/parseTemplate';
	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';
	import {
		applyTemplateDefaults,
		buildNodeData,
		cloneTemplateMessageData,
		getParamDisplayValue,
		getParamSource,
		getVariableLabel,
		patchParamSource,
		patchParamSourceType
	} from './template-message-form';

	let { id, data }: NodeProps<Node<WhatsappTemplateMessageData, 'templateMessage'>> = $props();
	const { updateNodeData } = useSvelteFlow();
	const updateNodeInternals = useUpdateNodeInternals();

	const initial = cloneTemplateMessageData((() => data)());
	let templateId = $state(initial.templateId);
	let headerParams = $state(initial.headerParams);
	let bodyParams = $state(initial.bodyParams);
	let buttons = $state(initial.buttons);
	let headerImageUrl = $state(initial.headerImageUrl);

	/** Template id we last applied Meta defaults for (per mount). */
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
		taint();
		const payload = buildNodeData({
			templateId,
			headerParams,
			bodyParams,
			buttons,
			headerImageUrl
		});
		updateNodeData(id, payload);
		updateNodeInternals(id);
	}

	const template = $derived.by(() => z.createQuery(queries.whatsappTemplate.read({ templateId })));
	const templateHeader = $derived(template.data?.components?.find((c) => c.type === 'HEADER'));
	const templateBody = $derived(template.data?.components?.find((c) => c.type === 'BODY'));
	const templateButtons = $derived(template.data?.components?.find((c) => c.type === 'BUTTONS'));

	$effect(() => {
		if (template.details?.type !== 'complete' || !template.data?.components) return;
		if (template.data.id !== templateId) return;
		if (hydratedForTemplateId === templateId) return;

		const mergeExisting =
			hasSavedParams && savedTemplateIdOnMount === templateId && hydratedForTemplateId === null;

		const next = applyTemplateDefaults(
			{ templateId, headerParams, bodyParams, buttons, headerImageUrl },
			template.data.components,
			{ mergeExisting }
		);
		templateId = next.templateId;
		headerParams = next.headerParams;
		bodyParams = next.bodyParams;
		buttons = next.buttons;
		headerImageUrl = next.headerImageUrl;
		hydratedForTemplateId = templateId;
		commit();
	});

	const { elementsSelectable, nodesDraggable, nodesConnectable } = useStore();
	const isDisabled = $derived(
		elementsSelectable === false || nodesDraggable === false || nodesConnectable === false
	);

	const header = $derived.by(() => {
		if (templateHeader?.format === 'TEXT') {
			return parseTemplate(templateHeader?.text ?? '');
		}
		return null;
	});
	const body = $derived(parseTemplate(templateBody?.text ?? ''));
	const bodyTokens = $derived(body.filter((t) => t.type === 'var'));
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

	function onTemplateSelect(newTemplateId: string) {
		hydratedForTemplateId = null;
		headerParams = [];
		bodyParams = [];
		buttons = [];
		headerImageUrl = null;
		templateId = newTemplateId;
		commit();
	}
	const nodes = useNodes();
</script>

<div class:pointer-events-none={isDisabled}>
	<NodeToolbar position={Position.Right}>
		<div class="flex flex-col gap-2">
			<Combobox value={templateId} onSelectChange={onTemplateSelect} />
		</div>
	</NodeToolbar>
	<div class="relative w-[260px] font-sans drop-shadow-md">
		<Handle
			type="target"
			position={Position.Top}
			class="z-20 h-3! w-3!"
			data-testid="flow-handle-target"
		/>

		<div class="rounded-lg border border-[#b7e4ac] bg-[#d9fdd3]">
			{#if templateHeader && templateHeader.format === 'IMAGE'}
				<div>
					<CroppedImageUpload
						class="h-full w-full rounded-b-none p-0"
						fileUrl={headerImageUrl}
						onUpload={async (url) => {
							headerImageUrl = url;
							commit();
						}}
					/>
				</div>
			{/if}

			{#if templateHeader && templateHeader.format === 'TEXT'}
				<div class="bg-white/50 p-2 pb-4 font-medium">
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
			{#if body && body.length > 0}
				<div class="bg-white/50 p-2 whitespace-pre-wrap">
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
				</div>
			{/if}
			{#if templateButtons && templateButtons.buttons.length > 0}
				<div class="flex flex-col bg-white/50">
					{#each templateButtons.buttons as btn, i (btn.text)}
						<div class="group relative flex items-center border-t border-[#b7e4ac]">
							<div
								class="w-full bg-transparent p-2.5 text-center text-sm font-medium text-[#00a884] outline-none"
							>
								{btn.text}
							</div>
							<Handle
								type="source"
								id={buttons[i]?.id || uuidv4()}
								position={Position.Right}
								class="h-3! w-3!"
								data-testid="flow-handle-source"
							/>
						</div>
					{/each}
				</div>
			{:else}
				<Handle
					type="source"
					position={Position.Bottom}
					class="h-3! w-3!"
					data-testid="flow-handle-source"
				/>
			{/if}
		</div>
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
