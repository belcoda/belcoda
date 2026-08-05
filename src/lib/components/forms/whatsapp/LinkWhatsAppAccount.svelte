<script lang="ts">
	import { t } from '$lib/index.svelte';
	import { goto } from '$app/navigation';
	import { v7 as uuidv7 } from 'uuid';
	import { z } from '$lib/zero.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import { appState } from '$lib/state.svelte';
	import {
		LINK_ACCOUNT_CODE_LENGTH,
		type LinkWhatsappAccountResult
	} from '$lib/schema/whatsapp-account';
	import * as InputOTP from '$lib/components/ui/input-otp/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';

	const { scope }: { scope: 'user' | 'organization' } = $props();

	// Placeholder external links — real destinations to be provided later.
	const FAQ_URL = 'https://belcoda.org/help/whatsapp-linked-devices';
	const WARMUP_URL = 'https://belcoda.org/help/whatsapp-warming-up-a-new-account';
	const LIST_URL = '/settings/whatsapp/_accounts';

	let code = $state('');
	let submitting = $state(false);
	let errorMessage = $state<string | null>(null);

	const isComplete = $derived(code.length === LINK_ACCOUNT_CODE_LENGTH);

	async function handleSubmit() {
		if (!isComplete || submitting) return;
		errorMessage = null;
		submitting = true;
		try {
			const response = await fetch('/api/utils/whatsapp/link_account', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ code, scope })
			});

			if (!response.ok) {
				const detail = await response.text().catch(() => '');
				errorMessage =
					detail || t`We couldn't link that account. Please check the code and try again.`;
				return;
			}

			const result = (await response.json()) as LinkWhatsappAccountResult;

			// The account belongs to the current user (user scope) or the current
			// organization (organization scope). The server re-checks this authorization.
			const referenceId = scope === 'user' ? appState.userId : appState.organizationId;

			await z.mutate(
				mutators.whatsappAccount.create({
					input: {
						scope,
						referenceId,
						identifier: result.identifier,
						details: result.details,
						metadata: result.metadata
					},
					metadata: { whatsappAccountId: uuidv7() }
				})
			);

			await goto(LIST_URL);
		} catch (err) {
			errorMessage = t`Something went wrong while linking the account. Please try again.`;
		} finally {
			submitting = false;
		}
	}
</script>

<div class="space-y-6">
	<Alert.Root variant="destructive">
		<TriangleAlertIcon class="size-4" />
		<Alert.Title>{t`Link at your own risk`}</Alert.Title>
		<Alert.Description>
			{t`Belcoda links your account using the unofficial WhatsApp Linked Devices API, which is not endorsed or supported by Meta Platforms, Inc. Using a WhatsApp account in Belcoda this way may violate Meta's terms of service, and we cannot rule out the risk of your account being suspended or banned. Only link an account you are comfortable putting at that risk.`}
		</Alert.Description>
	</Alert.Root>

	<div class="flex flex-wrap gap-4 text-sm">
		<a
			href={FAQ_URL}
			target="_blank"
			rel="noopener noreferrer"
			class="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
			data-testid="link-whatsapp-faq"
		>
			{t`Read the FAQ`}
			<ExternalLinkIcon class="size-3.5" />
		</a>
		<a
			href={WARMUP_URL}
			target="_blank"
			rel="noopener noreferrer"
			class="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
			data-testid="link-whatsapp-warmup"
		>
			{t`Using a new account? Read our warm-up tips`}
			<ExternalLinkIcon class="size-3.5" />
		</a>
	</div>

	<form
		class="space-y-4"
		onsubmit={(e) => {
			e.preventDefault();
			handleSubmit();
		}}
	>
		<div class="space-y-2">
			<Label for="link-code">{t`Signup code`}</Label>
			<p class="text-sm text-muted-foreground">
				{t`Enter the ${String(LINK_ACCOUNT_CODE_LENGTH)}-digit code to link your WhatsApp account.`}
			</p>
			<InputOTP.Root
				maxlength={LINK_ACCOUNT_CODE_LENGTH}
				bind:value={code}
				disabled={submitting}
				data-testid="link-whatsapp-code"
			>
				{#snippet children({ cells })}
					<InputOTP.Group>
						{#each cells as cell, i (i)}
							<InputOTP.Slot {cell} />
						{/each}
					</InputOTP.Group>
				{/snippet}
			</InputOTP.Root>
		</div>

		{#if errorMessage}
			<Alert.Root variant="destructive" data-testid="link-whatsapp-error">
				<TriangleAlertIcon class="size-4" />
				<Alert.Description>{errorMessage}</Alert.Description>
			</Alert.Root>
		{/if}

		<Button type="submit" disabled={!isComplete || submitting} data-testid="link-whatsapp-submit">
			{#if submitting}
				<Spinner />
			{/if}
			{t`Link account`}
		</Button>
	</form>
</div>
