<script lang="ts">
	import ResponsiveModal from '$lib/components/ui/responsive-modal/responsive-modal.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { z } from '$lib/zero.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import { appState } from '$lib/state.svelte';
	import { parse } from 'valibot';
	import { updateWebhookInput } from '$lib/schema/webhook';
	import { toast } from 'svelte-sonner';
	import { t } from '$lib/index.svelte';

	type WebhookEditTarget = {
		id: string;
		name: string;
		targetUrl: string;
	};

	type Props = {
		open?: boolean;
		webhook: WebhookEditTarget | null;
		onClose?: () => void;
	};

	let { open = $bindable(false), webhook, onClose }: Props = $props();

	let name = $state('');
	let targetUrl = $state('');

	$effect(() => {
		if (open && webhook) {
			name = webhook.name;
			targetUrl = webhook.targetUrl;
		}
	});

	function handleOpenChange(isOpen: boolean) {
		if (!isOpen) {
			onClose?.();
		}
	}

	async function handleSave() {
		if (!webhook) {
			return;
		}
		if (!name.trim() || !targetUrl.trim()) {
			toast.error(t`Please fill in all required fields`);
			return;
		}
		try {
			const input = parse(updateWebhookInput, {
				name: name.trim(),
				targetUrl: targetUrl.trim()
			});
			const response = z.mutate(
				mutators.webhook.update({
					metadata: {
						webhookId: webhook.id,
						organizationId: appState.organizationId
					},
					input
				})
			);
			await response.server;
			toast.success(t`Webhook updated successfully`);
			open = false;
		} catch (error) {
			toast.error(error instanceof Error ? error.message : t`Failed to update webhook`);
		}
	}
</script>

<ResponsiveModal
	title={t`Edit webhook`}
	description={t`Change the name and the endpoint where this webhook receives events.`}
	bind:open
	onOpenChange={handleOpenChange}
>
	<div class="space-y-2">
		<Label for="webhook-edit-name">{t`Name`}</Label>
		<Input
			id="webhook-edit-name"
			data-testid="settings-webhooks-edit-name-input"
			bind:value={name}
			placeholder={t`My Webhook`}
			required
		/>
	</div>
	<div class="space-y-2">
		<Label for="webhook-edit-url">{t`Target URL`}</Label>
		<Input
			id="webhook-edit-url"
			data-testid="settings-webhooks-edit-url-input"
			bind:value={targetUrl}
			type="url"
			placeholder={t`https://example.com/webhook`}
			required
		/>
	</div>
	{#snippet footer()}
		<div class="flex justify-end gap-2">
			<Button variant="outline" onclick={() => (open = false)}>{t`Cancel`}</Button>
			<Button data-testid="settings-webhooks-edit-submit" onclick={handleSave}>
				{t`Save`}
			</Button>
		</div>
	{/snippet}
</ResponsiveModal>
