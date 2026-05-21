<script lang="ts">
	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';
	import { appState } from '$lib/state.svelte';
	import { useNodes, Panel } from '@xyflow/svelte';
	import { t } from '$lib/index.svelte';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { goto } from '$app/navigation';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';
	import { tick } from 'svelte';
	import TestMessageModal from '$lib/components/flow/whatsapp/TestMessageModal.svelte';
	const nodes = useNodes();
	const templateNode = $derived(nodes.current.find((n) => n.type === 'templateMessage'));
	const templateIdForRead = $derived(
		(templateNode?.data as { templateId?: string } | undefined)?.templateId
	);
	const templateReadQuery = $derived.by(() => {
		const id = templateIdForRead;
		if (!id) return null;
		return z.createQuery(queries.whatsappTemplate.read({ templateId: id }));
	});
	const templateLoaded = $derived(templateReadQuery?.details?.type === 'complete');
	const templateStatus = $derived(templateReadQuery?.data?.status ?? null);
	const isTemplateApproved = $derived(templateLoaded && templateStatus === 'APPROVED');
	const canSend = $derived(!!templateNode && templateLoaded && isTemplateApproved);
	const showTemplateApprovalBanner = $derived(
		!!templateIdForRead && templateLoaded && !isTemplateApproved
	);
	const hasTemplateId = $derived(
		appState.activeOrganization?.data?.settings.whatsApp.defaultTemplateId
	);
	const whatsappThreadId = page.params.whatsappThreadId;
	async function discardThread() {
		if (!whatsappThreadId) return;
		if (window.confirm(t`Are you sure you want to discard this WhatsApp draft?`)) {
			z.mutate(
				mutators.whatsappThread.delete({
					id: whatsappThreadId,
					organizationId: appState.organizationId
				})
			);
			await goto('/communications/whatsapp/drafts');
		}
	}

	async function sendThread() {
		if (!whatsappThreadId) return;
		if (!window.confirm(t`Are you sure you want to send this WhatsApp draft?`)) {
			return;
		}
		try {
			const result = z.mutate(
				mutators.whatsappThread.send({
					whatsappThreadId: whatsappThreadId,
					organizationId: appState.organizationId,
					userId: appState.userId
				})
			);

			await result.server;
			await tick();
			await goto(`/communications/whatsapp/sent/${whatsappThreadId}`);
			toast.success(t`WhatsApp draft sent successfully`);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : t`Failed to send WhatsApp draft`);
		}
	}
</script>

{#if showTemplateApprovalBanner}
	<Panel position="top-center" class="pointer-events-auto z-10 max-w-xl px-4">
		<Alert.Root>
			<TriangleAlertIcon />
			<Alert.Title>{t`Template not approved`}</Alert.Title>
			<Alert.Description class="space-y-2">
				{#if templateReadQuery?.data}
					<p>
						{t`The selected template (${templateReadQuery.data.name}) is currently ${String(templateStatus)}. You can edit this draft, but it cannot be sent until the template is approved.`}
					</p>
				{:else}
					<p>
						{t`This template is not available or is not approved. Select an approved template before sending.`}
					</p>
				{/if}
				{#if templateIdForRead}
					<div>
						<Button
							variant="outline"
							size="sm"
							href="/settings/whatsapp/templates/{templateIdForRead}"
						>
							{t`View template settings`}
						</Button>
					</div>
				{/if}
			</Alert.Description>
		</Alert.Root>
	</Panel>
{/if}

<Panel position="bottom-right">
	<div class="flex items-center gap-2">
		<TestMessageModal />
		<Button
			variant="destructive"
			size="sm"
			data-testid="flow-discard-button"
			onclick={discardThread}>{t`Discard`}</Button
		>
		{#if !canSend}
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props })}
						<span {...props} class="inline-flex">
							<Button
								variant="default"
								size="sm"
								data-testid="flow-send-button"
								disabled
								type="button">{t`Send`}</Button
							>
						</span>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Content class="max-w-xs" side="top">
					{t`Only approved WhatsApp templates can be sent. Select an approved template or wait for Meta to approve your template.`}
				</Tooltip.Content>
			</Tooltip.Root>
		{:else}
			<Button variant="default" size="sm" data-testid="flow-send-button" onclick={sendThread}
				>{t`Send`}</Button
			>
		{/if}
	</div>
</Panel>
