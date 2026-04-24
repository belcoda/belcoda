<script lang="ts">
	import ResponsiveModal from '$lib/components/ui/responsive-modal/responsive-modal.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import { toast } from 'svelte-sonner';
	import { t } from '$lib/index.svelte';

	let open = $state(false);
	let webhookName = $state<string | null>(null);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let secret = $state<string | null>(null);

	function reset() {
		secret = null;
		error = null;
		loading = false;
		webhookName = null;
	}

	function handleOpenChange(next: boolean) {
		if (!next) {
			open = false;
			reset();
		}
	}
	import { get } from '$lib/utils/http';
	import { object, string } from 'valibot';
	export async function openFor(target: { id: string; name: string }) {
		webhookName = target.name;
		secret = null;
		error = null;
		loading = true;
		open = true;
		try {
			const result = await get({
				path: `/api/utils/webhook/${target.id}`,
				schema: object({ secret: string() })
			});
			secret = result.secret;
		} catch {
			error = t`Could not load the webhook secret.`;
		} finally {
			loading = false;
		}
	}

	function copySecretToClipboard() {
		if (secret) {
			navigator.clipboard.writeText(secret);
			toast.success(t`Secret copied to clipboard`);
		}
	}
</script>

<ResponsiveModal
	title={t`Webhook secret`}
	description={webhookName ? t`Signing secret for "${webhookName}"` : undefined}
	bind:open
	onOpenChange={handleOpenChange}
>
	{#snippet children()}
		{#if loading}
			<div class="flex justify-center py-6">
				<Spinner class="h-8 w-8" />
			</div>
		{:else if error}
			<p class="text-sm text-destructive">{error}</p>
		{:else if secret}
			<div class="space-y-2">
				<Label for="webhook-secret-display">{t`Secret`}</Label>
				<div class="flex items-center gap-2">
					<Input
						id="webhook-secret-display"
						value={secret}
						readonly
						class="font-mono text-sm"
						data-testid="settings-webhooks-secret-value"
					/>
					<Button
						type="button"
						variant="outline"
						size="icon"
						onclick={copySecretToClipboard}
						title={t`Copy to clipboard`}
						data-testid="settings-webhooks-secret-copy"
					>
						<CopyIcon class="h-4 w-4" />
					</Button>
				</div>
			</div>
		{/if}
	{/snippet}
	{#snippet footer()}
		<div class="flex justify-end">
			<Button variant="outline" onclick={() => (open = false)}>{t`Close`}</Button>
		</div>
	{/snippet}
</ResponsiveModal>
