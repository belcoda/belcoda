<script lang="ts">
	import type { ReadWhatsappTemplateZero } from '$lib/schema/whatsapp-template';
	import type { WhatsappTemplateStatus } from '$lib/schema/whatsapp/template/status';
	import type { WhatsappTemplateMessageData } from '$lib/schema/flow/index';
	import { appState, getListFilter } from '$lib/state.svelte';
	import SendBusinessApiTemplateMessage from '$lib/components/widgets/communications/send_wa_msg/SendBusinessApiTemplateMessage.svelte';
	import { z } from '$lib/zero.svelte';
	import LoaderIcon from '@lucide/svelte/icons/loader';
	import queries from '$lib/zero/query/index';
	const { personId }: { personId: string } = $props();

	function createEmptyMessageData(id: string): WhatsappTemplateMessageData {
		return { templateId: id, header: {}, body: {}, buttons: [] };
	}

	let messageData = $state<WhatsappTemplateMessageData>(createEmptyMessageData(''));

	let filter = $derived({
		...getListFilter(appState.organizationId),
		statusIn: ['APPROVED'] as WhatsappTemplateStatus[]
	});
	const allApprovedTemplates = $derived.by(() => {
		return z.createQuery(queries.whatsappTemplate.list(filter));
	});

	//filter out all templates that DO HAVE buttons (we can't send button templates with a single message with no actions/automations)
	const filteredTemplates = $derived(
		(allApprovedTemplates.data ?? []).filter((t) => !t.components.some((c) => c.type === 'BUTTONS'))
	);

	let templateId: string = $state(
		appState.activeOrganization?.data?.settings.whatsApp.defaultTemplateId ??
			(() => filteredTemplates[0]?.id)()
	);

	//if defaultTemplateId is part of the filteredTemplates, use that, otherwise use the first template
	const template = $derived(
		filteredTemplates.find((t) => t.id === templateId) ?? filteredTemplates[0] ?? null
	);

	let open = $state(false);
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Command from '$lib/components/ui/command/index.js';
	import SquarePenIcon from '@lucide/svelte/icons/square-pen';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import { Button } from '$lib/components/ui/button/index.js';
	import CheckIcon from '@lucide/svelte/icons/check';
	import { cn } from '$lib/utils.js';
	import { t } from '$lib/index.svelte';
	let searchString = $state('');
	let sending = $state(false);
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import { v7 as uuidv7 } from 'uuid';
	let templateVariableResetKey = $state(0);
	async function sendMessage() {
		if (sending) return;
		sending = true;
		const messageId = uuidv7();
		try {
			const result = z.mutate(
				mutators.whatsappMessage.sendIndividualTemplateMessage({
					input: {
						whatsappTemplateMessage: $state.snapshot(messageData)
					},
					metadata: {
						organizationId: appState.organizationId,
						personId: personId,
						activityId: uuidv7(),
						sentByUserId: appState.userId,
						whatsappMessageId: messageId,
						templateComponents: $state.snapshot(template.components),
						templateId: template.id
					}
				})
			);
			await result.server;
			messageData = createEmptyMessageData(template.id);
			templateVariableResetKey++;
		} finally {
			sending = false;
		}
	}
</script>

<div class="flex w-full items-end gap-2" data-testid="person-wa-compose-template">
	<Popover.Root bind:open>
		<Popover.Trigger>
			{#snippet child({ props })}
				<Button
					{...props}
					variant="default"
					class="rounded-full"
					size="icon"
					role="combobox"
					aria-expanded={open}
				>
					<SquarePenIcon />
				</Button>
			{/snippet}
		</Popover.Trigger>
		<Popover.Content class="p-0">
			<Command.Root>
				<Command.Input bind:value={searchString} placeholder={t`Search templates...`} />
				<Command.List>
					<Command.Empty>
						<div class="space-y-2 px-2 py-3 text-sm">
							<p>{t`No approved templates found.`}</p>
							<Button variant="link" class="h-auto p-0" href="/settings/whatsapp/templates"
								>{t`Manage templates`}</Button
							>
						</div>
					</Command.Empty>
					<Command.Group value="templates">
						{#each filteredTemplates as templateItem (templateItem.id)}
							<Command.Item
								value={templateItem.id}
								onSelect={() => {
									templateId = templateItem.id;
									open = false;
								}}
							>
								<CheckIcon class={cn(template?.id !== templateItem.id && 'text-transparent')} />
								{templateItem.name}
							</Command.Item>
						{/each}
					</Command.Group>
				</Command.List>
			</Command.Root>
		</Popover.Content>
	</Popover.Root>
	<div class="w-full grow">
		{#if template}
			{#key `template.id-${templateVariableResetKey}`}
				<SendBusinessApiTemplateMessage
					template={template as ReadWhatsappTemplateZero}
					bind:data={messageData}
				/>
			{/key}
		{/if}
	</div>
	<Button
		variant="default"
		class="rounded-full"
		size="icon"
		onclick={sendMessage}
		disabled={sending}
	>
		{#if sending}
			<LoaderIcon class="size-4 animate-spin" />
		{:else}
			<ArrowUpIcon />
		{/if}
		<span class="sr-only">{t`Send`}</span>
	</Button>
</div>
