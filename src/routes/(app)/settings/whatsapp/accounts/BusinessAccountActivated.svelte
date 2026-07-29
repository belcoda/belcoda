<script lang="ts">
	import { t } from '$lib/index.svelte';
	import { whatsappAccountState } from './whatsapp_account_state.svelte';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';

	const loading = $derived(whatsappAccountState.loading);
	const error = $derived(whatsappAccountState.error);
	const waba = $derived(whatsappAccountState.waba);

	function formatStatus(value: string | null | undefined): string {
		if (!value) return t`—`;
		return value
			.toLowerCase()
			.split('_')
			.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
			.join(' ');
	}
</script>

<Card.Root data-testid="whatsapp-accounts-activated-card">
	<Card.Header>
		<Card.Title>{t`WhatsApp Business Account Activated`}</Card.Title>
		<Card.Description>
			{t`Your WhatsApp Business Account is connected. Review verification and account details below.`}
		</Card.Description>
	</Card.Header>
	<Card.Content class="space-y-4">
		{#if loading}
			<div class="space-y-4">
				<Skeleton class="h-16 w-full rounded-lg" />
				<div class="grid gap-4 sm:grid-cols-2">
					<Skeleton class="h-14 w-full rounded-lg" />
					<Skeleton class="h-14 w-full rounded-lg" />
					<Skeleton class="h-14 w-full rounded-lg" />
					<Skeleton class="h-14 w-full rounded-lg" />
				</div>
			</div>
		{:else if error}
			<Alert.Root variant="destructive">
				<Alert.Title>{t`Error`}</Alert.Title>
				<Alert.Description>{error}</Alert.Description>
			</Alert.Root>
		{:else if waba}
			<div class="grid gap-4 sm:grid-cols-2">
				<div class="space-y-1">
					<p class="text-xs text-muted-foreground">{t`WABA name`}</p>
					<p class="text-sm">{waba.name ?? t`—`}</p>
				</div>
				<div class="space-y-1">
					<p class="text-xs text-muted-foreground">{t`Business legal name`}</p>
					<p class="text-sm">{waba.businessName ?? t`—`}</p>
				</div>
				<div class="space-y-1">
					<p class="text-xs text-muted-foreground">{t`Business status`}</p>
					<p class="text-sm">{formatStatus(waba.businessStatus)}</p>
				</div>
				<div class="space-y-1">
					<p class="text-xs text-muted-foreground">{t`Verification status`}</p>
					<p class="text-sm">{formatStatus(waba.businessVerificationStatus)}</p>
				</div>
				<div class="space-y-1">
					<p class="text-xs text-muted-foreground">{t`Messaging limit`}</p>
					<p class="text-sm">{waba.whatsappBusinessManagerMessagingLimit ?? t`—`}</p>
				</div>
				<div class="space-y-1">
					<p class="text-xs text-muted-foreground">{t`Business ID`}</p>
					<p class="text-sm">{waba.businessId ?? t`—`}</p>
				</div>
			</div>

			{#if waba.businessVerificationStatus?.toLowerCase() === 'not_verified'}
				<Alert.Root class="border-amber-300 bg-amber-50/60 text-amber-950">
					<Alert.Title>{t`Business verification required`}</Alert.Title>
					<Alert.Description class="text-amber-950/90">
						{t`Your organizational display name is hidden from message recipients until your business verification process is complete.`}
						<a
							href="https://support.belcoda.com/docs/getting-started/whatsapp-business-verification"
							target="_blank"
							rel="noopener noreferrer"
							class="ml-1 underline">{t`Complete verification`}</a
						>
					</Alert.Description>
				</Alert.Root>
			{/if}
		{/if}
	</Card.Content>
</Card.Root>
