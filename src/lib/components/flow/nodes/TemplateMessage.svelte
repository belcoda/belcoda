<script lang="ts">
	import { v4 as uuidv4 } from 'uuid';
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
	import type { WhatsappTemplateMessageData } from '$lib/schema/flow/index';

	import CroppedImageUpload from '$lib/components/ui/image-upload/CroppedImageUpload.svelte';
	let { id, data }: NodeProps<Node<WhatsappTemplateMessageData, 'templateMessage'>> = $props();
	const { updateNodeData } = useSvelteFlow();
	const updateNodeInternals = useUpdateNodeInternals();

	import Combobox from './template/Combobox.svelte';

	// --- State Management ---
	let headerValues = $state(data.header?.templateStrings ?? []);
	let bodyValues = $state(data.body?.templateStrings ?? []);
	$inspect(bodyValues);
	let buttons = $state(data.buttons ?? []);
	let headerImageUrl = $state(data.header?.imageUrl ?? null);
	let templateId = $state(data.templateId);

	const { elementsSelectable, nodesDraggable, nodesConnectable } = useStore();
	const isDisabled = $derived(
		elementsSelectable === false || nodesDraggable === false || nodesConnectable === false
	);

	// Sync changes back to the Flow state
	$effect(() => {
		updateNodeData(id, {
			header: { templateStrings: headerValues, imageUrl: headerImageUrl },
			body: { templateStrings: bodyValues },
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
					if (!bodyValues[i]) {
						bodyValues[i] = value;
					}
				}
			}
		}
	);

	watch(
		() => templateHeader,
		(data) => {
			if (templateHeader?.format === 'IMAGE') {
				headerImageUrl = headerImageUrl || templateHeader?.example.header_url[0];
			} else {
				headerValues[0] = headerValues[0] || templateHeader?.example.header_text[0] || '';
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
		<Handle type="target" position={Position.Top} class="z-20 h-3! w-3!" />

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
											>{headerValues[0] || `{{${item.id}}}`}</span
										>
									{/snippet}
								</Popover.Trigger>
								<Popover.Content class="w-80 bg-none">
									<Input bind:value={headerValues[0]} />
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
											>{bodyValues[getTokenArrayIndex(item.id)] || `{{${item.id}}}`}</span
										>
									{/snippet}
								</Popover.Trigger>
								<Popover.Content class="w-80 bg-none">
									<Input bind:value={bodyValues[getTokenArrayIndex(item.id)]} />
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
							/>
						</div>
					{/each}
				</div>
			{:else}
				<Handle type="source" position={Position.Bottom} class="h-3! w-3!" />
			{/if}
		</div>
	</div>
</div>
