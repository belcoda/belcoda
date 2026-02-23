<script lang="ts">
	import { page } from '$app/state';
	import { t } from '$lib/index.svelte';
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import { appState } from '$lib/state.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import H2 from '$lib/components/ui/typography/H2.svelte';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { toast } from 'svelte-sonner';
	import { CREDIT_PURCHASE_AMOUNTS_USD } from '$lib/utils/billing/credit';

	type CheckoutResponse = {
		url?: string;
		error?: string;
	};

	const canManageBilling = $derived(appState.isOwner);
	const organization = appState.activeOrganization;

	let purchasingAmount = $state<number | null>(null);
	let lastPurchaseStatus = $state<string | null>(null);

	const formattedCreditBalance = $derived.by(() => {
		const balance = organization.data?.balance ?? 0;
		return new Intl.NumberFormat('en-US').format(balance);
	});

	$effect(() => {
		const purchaseStatus = page.url.searchParams.get('credit_purchase');
		if (!purchaseStatus || purchaseStatus === lastPurchaseStatus) {
			return;
		}
		lastPurchaseStatus = purchaseStatus;
		if (purchaseStatus === 'success') {
			toast.success(t`Credit purchase completed. Your balance will update shortly.`);
		}
		if (purchaseStatus === 'cancelled') {
			toast.info(t`Credit purchase was cancelled.`);
		}
	});

	async function purchaseCredits(amount: number) {
		if (!canManageBilling || purchasingAmount !== null) {
			return;
		}
		try {
			purchasingAmount = amount;
			const response = await fetch('/api/billing/credit/checkout', {
				method: 'POST',
				headers: {
					'content-type': 'application/json'
				},
				body: JSON.stringify({
					amount,
					organizationId: appState.organizationId
				})
			});

			const payload = (await response.json().catch(() => ({}))) as CheckoutResponse;
			if (!response.ok || !payload.url) {
				throw new Error(payload.error || t`Unable to start Stripe checkout`);
			}

			window.location.href = payload.url;
		} catch (err) {
			console.error(err);
			toast.error(err instanceof Error ? err.message : t`Unable to start Stripe checkout`);
			purchasingAmount = null;
		}
	}
</script>

{#if !canManageBilling}
	<ContentLayout rootLink="/settings" {header}>
		<Card.Root>
			<Card.Content class="pt-6">
				<p>
					{t`You don't have permission to manage credit purchases. Only organization owners can access this page.`}
				</p>
			</Card.Content>
		</Card.Root>
	</ContentLayout>
{:else}
	<ContentLayout rootLink="/settings" {header}>
		<div class="space-y-6">
			<Card.Root>
				<Card.Header>
					<Card.Title>{t`Credit balance`}</Card.Title>
					<Card.Description>
						{t`This balance belongs to your organization and is shared across your workspace.`}
					</Card.Description>
				</Card.Header>
				<Card.Content>
					<p class="text-3xl font-semibold">{formattedCreditBalance}</p>
					<p class="mt-2 text-sm text-muted-foreground">
						{t`Purchase additional credit with Stripe using one of the preset amounts below.`}
					</p>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title>{t`Buy more credit`}</Card.Title>
					<Card.Description
						>{t`Select a preset amount to continue in Stripe checkout.`}</Card.Description
					>
				</Card.Header>
				<Card.Content class="grid gap-3 sm:grid-cols-3">
					{#each CREDIT_PURCHASE_AMOUNTS_USD as amount}
						<Button
							variant="outline"
							disabled={purchasingAmount !== null}
							onclick={() => purchaseCredits(amount)}
						>
							{#if purchasingAmount === amount}
								<Spinner class="mr-2 h-4 w-4" />
								{t`Redirecting...`}
							{:else}
								{`Buy ${(amount * 100).toLocaleString()} credits (US$${amount})`}
							{/if}
						</Button>
					{/each}
				</Card.Content>
			</Card.Root>
		</div>
	</ContentLayout>
{/if}

{#snippet header()}
	<div class="flex items-center justify-between">
		<H2>{t`Credit balance`}</H2>
	</div>
{/snippet}
