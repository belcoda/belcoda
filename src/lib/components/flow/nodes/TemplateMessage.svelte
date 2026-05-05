<script lang="ts">
	import { v4 as uuidv4 } from 'uuid';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import {
		Position,
		useSvelteFlow,
		type NodeProps,
		useStore,
		Handle,
		type Node,
		NodeToolbar,
		useUpdateNodeInternals
	} from '@xyflow/svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { WhatsappTemplateMessageData } from '$lib/schema/flow/index';
	import type { TemplateParamSource, TemplateVariableKey } from '$lib/schema/template-variables';

	import CroppedImageUpload from '$lib/components/ui/image-upload/CroppedImageUpload.svelte';
	import TemplateVariablePicker from '$lib/components/templates/TemplateVariablePicker.svelte';
	import { t } from '$lib/index.svelte';
	let { id, data }: NodeProps<Node<WhatsappTemplateMessageData, 'templateMessage'>> = $props();
	const { updateNodeData } = useSvelteFlow();
	const updateNodeInternals = useUpdateNodeInternals();

	import Combobox from './template/Combobox.svelte';

	function getInitialParamSources(
		templateParams: TemplateParamSource[] | undefined,
		templateStrings: string[] | undefined
	): TemplateParamSource[] {
		if (templateParams) {
			return templateParams.map((param) => ({ ...param }));
		}

		return templateStrings?.map((value) => ({ type: 'literal' as const, value })) ?? [];
	}

	function getParamTemplateString(param: TemplateParamSource | undefined) {
		if (!param) return '';
		if (param.type === 'literal') return param.value;
		return param.fallback ?? '';
	}

	function getParamDisplayValue(params: TemplateParamSource[], index: number, placeholder: string) {
		const param = params[index];
		if (!param) return placeholder;
		if (param.type === 'literal') return param.value || placeholder;
		return param.fallback || getVariableLabel(param.key);
	}

	function getVariableLabel(key: TemplateVariableKey) {
		switch (key) {
			case 'person.given_name':
				return t`Given name`;
			case 'person.family_name':
				return t`Family name`;
			case 'person.email_address':
				return t`Email address`;
			case 'person.phone_number':
				return t`Phone number`;
			case 'organization.name':
				return t`Organization name`;
			case 'organization.slug':
				return t`Organization slug`;
			case 'sender.name':
				return t`Sender name`;
			case 'sender.email':
				return t`Sender email`;
			case 'event.name':
				return t`Event name`;
			case 'event.start_date':
				return t`Event start date`;
			case 'event.location':
				return t`Event location`;
			case 'petition.name':
				return t`Petition name`;
			case 'petition.goal_count':
				return t`Petition goal`;
			default:
				return key;
		}
	}

	function getParamSource(params: TemplateParamSource[], index: number): TemplateParamSource {
		return params[index] ?? { type: 'literal', value: '' };
	}

	function setParamSource(
		params: TemplateParamSource[],
		index: number,
		source: TemplateParamSource
	) {
		params[index] = source;
	}

	function setParamSourceType(
		params: TemplateParamSource[],
		index: number,
		type: TemplateParamSource['type']
	) {
		const current = getParamSource(params, index);
		if (type === 'literal') {
			setParamSource(params, index, {
				type: 'literal',
				value: getParamTemplateString(current)
			});
			return;
		}

		setParamSource(params, index, {
			type: 'variable',
			key: current.type === 'variable' ? current.key : 'person.given_name',
			fallback: getParamTemplateString(current)
		});
	}

	function setLiteralParamValue(params: TemplateParamSource[], index: number, value: string) {
		setParamSource(params, index, { type: 'literal', value });
	}

	function setVariableParamFallback(
		params: TemplateParamSource[],
		index: number,
		fallback: string
	) {
		const current = getParamSource(params, index);
		setParamSource(params, index, {
			type: 'variable',
			key: current.type === 'variable' ? current.key : 'person.given_name',
			fallback
		});
	}

	function ensureLiteralParam(params: TemplateParamSource[], index: number, value: string) {
		if (!params[index]) {
			params[index] = { type: 'literal', value };
		}
	}

	// --- State Management ---
	// svelte-ignore state_referenced_locally
	let headerParams = $state(
		getInitialParamSources(data.header?.templateParams, data.header?.templateStrings)
	);
	// svelte-ignore state_referenced_locally
	let bodyParams = $state(
		getInitialParamSources(data.body?.templateParams, data.body?.templateStrings)
	);
	// svelte-ignore state_referenced_locally
	let buttons = $state(data.buttons ?? []);
	// svelte-ignore state_referenced_locally
	let headerImageUrl = $state(data.header?.imageUrl ?? null);
	// svelte-ignore state_referenced_locally
	let templateId = $state(data.templateId);

	const { elementsSelectable, nodesDraggable, nodesConnectable } = useStore();
	const isDisabled = $derived(
		elementsSelectable === false || nodesDraggable === false || nodesConnectable === false
	);

	// Sync changes back to the Flow state
	$effect(() => {
		updateNodeData(id, {
			header: {
				templateStrings: headerParams.map(getParamTemplateString),
				templateParams: headerParams,
				imageUrl: headerImageUrl
			},
			body: {
				templateStrings: bodyParams.map(getParamTemplateString),
				templateParams: bodyParams
			},
			buttons,
			templateId
		});
		updateNodeInternals(id);
	});
	import { watch } from 'runed';
	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';
	const template = $derived.by(() => {
		return z.createQuery(queries.whatsappTemplate.read({ templateId: data.templateId }));
	});
	const templateHeader = $derived(template.data?.components?.find((c) => c.type === 'HEADER'));
	const templateBody = $derived(template.data?.components?.find((c) => c.type === 'BODY'));
	$inspect(templateBody);
	const templateButtons = $derived(template.data?.components?.find((c) => c.type === 'BUTTONS'));
	// set the initial values for the componets based on the template
	watch(
		() => templateButtons,
		(data) => {
			if (templateButtons?.buttons) {
				// if the template has fewer buttons than the current buttons, remove the extra buttons
				if (buttons.length > templateButtons?.buttons.length) {
					buttons = buttons.slice(0, templateButtons?.buttons.length);
				}
				// if the template has more buttons than the current buttons, add the extra buttons with random ids
				if (buttons.length < templateButtons?.buttons.length) {
					buttons = [
						...buttons,
						...templateButtons?.buttons.slice(buttons.length).map((b) => ({ id: uuidv4() }))
					];
				}
			}
		}
	);
	watch(
		() => templateBody,
		(data) => {
			if (templateBody?.example) {
				for (let i = 0; i < templateBody.example.body_text[0].length; i++) {
					const value = templateBody.example.body_text[0][i];
					ensureLiteralParam(bodyParams, i, value);
				}
			}
		}
	);

	watch(
		() => templateHeader,
		(data) => {
			if (!data) {
				headerParams = [];
				headerImageUrl = null;
			} else if (data.format === 'IMAGE' && 'header_url' in data.example) {
				headerImageUrl = headerImageUrl || data.example.header_url[0];
			} else {
				ensureLiteralParam(
					headerParams,
					0,
					'header_text' in data.example ? data.example.header_text[0] || '' : ''
				);
			}
		}
	);

	import { parseTemplate } from './template/parseTemplate';

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
	const headerTokens = $derived(header?.filter((t) => t.type === 'var') || []);
	const headerExampleImageUrl = $derived(
		templateHeader?.example && 'header_url' in templateHeader?.example
			? templateHeader?.example.header_url[0]
			: null
	);
</script>

<div class:pointer-events-none={isDisabled}>
	<NodeToolbar position={Position.Right}>
		<div class="flex flex-col gap-2">
			<Combobox bind:value={templateId} onSelectChange={() => {}} />
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
						}}
					/>
				</div>
			{/if}

			{#if templateHeader && templateHeader.format === 'TEXT'}
				<div class="bg-white/50 p-2 pb-4 font-medium">
					{#each header as item, i}
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
									{@render paramSourceEditor(headerParams, 0)}
								</Popover.Content>
							</Popover.Root>
						{/if}
					{/each}
				</div>
			{/if}
			{#if body && body.length > 0}
				<div class="bg-white/50 p-2 whitespace-pre-wrap">
					{#each body as item, i}
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
									{@render paramSourceEditor(bodyParams, getTokenArrayIndex(item.id))}
								</Popover.Content>
							</Popover.Root>
						{/if}
					{/each}
				</div>
			{/if}
			{#if templateButtons && templateButtons.buttons.length > 0}
				<div class="flex flex-col bg-white/50">
					{#each templateButtons.buttons as btn, i}
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

{#snippet paramSourceEditor(params: TemplateParamSource[], index: number)}
	{@const source = getParamSource(params, index)}
	<div class="space-y-3">
		<div class="flex gap-2">
			<Button
				size="sm"
				variant={source.type === 'literal' ? 'default' : 'outline'}
				onclick={() => setParamSourceType(params, index, 'literal')}
			>
				{t`Text`}
			</Button>
			<Button
				size="sm"
				variant={source.type === 'variable' ? 'default' : 'outline'}
				onclick={() => setParamSourceType(params, index, 'variable')}
			>
				{t`Variable`}
			</Button>
		</div>

		{#if source.type === 'literal'}
			<Input
				value={source.value}
				oninput={(event) => {
					setLiteralParamValue(params, index, event.currentTarget.value);
				}}
			/>
		{:else}
			<div class="space-y-2">
				<div class="flex items-center gap-2">
					<TemplateVariablePicker
						triggerLabel={t`Variable`}
						onSelect={(_, variable) => {
							setParamSource(params, index, {
								type: 'variable',
								key: variable.key,
								fallback: source.fallback
							});
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
						setVariableParamFallback(params, index, event.currentTarget.value);
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
