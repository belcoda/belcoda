<script lang="ts">
	import { page } from '$app/state';
	import { t } from '$lib/index.svelte';
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import { appState } from '$lib/state.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import H2 from '$lib/components/ui/typography/H2.svelte';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { toast } from 'svelte-sonner';
	import { locale } from '$lib/index.svelte';
	import {
		BALANCE_TOP_UP_PRESET_AMOUNTS_USD,
		BALANCE_TOP_UP_MIN_USD,
		BALANCE_TOP_UP_MAX_USD,
		formatUsdAmount,
		formatUsdBalanceFromHundredthsOfCents,
		isValidBalanceTopUpAmountUsd
	} from '$lib/utils/billing/balance';

	type CheckoutResponse = {
		url?: string;
		error?: string;
	};

	const canManageBilling = $derived(appState.isOwner);
	const organization = appState.activeOrganization;

	let purchasingAmount = $state<number | null>(null);
	let lastPurchaseStatus = $state<string | null>(null);
	let purchaseAmountInput = $state('50');

	const parsedPurchaseAmount = $derived.by(() => {
		const parsed = Number.parseInt(purchaseAmountInput, 10);
		if (!Number.isFinite(parsed)) {
			return null;
		}
		return parsed;
	});

	const isPurchaseAmountValid = $derived(
		parsedPurchaseAmount !== null && isValidBalanceTopUpAmountUsd(parsedPurchaseAmount)
	);

	const formattedBalance = $derived.by(() => {
		const balanceInHundredthsOfCents = organization.data?.balance ?? 0;
		return formatUsdBalanceFromHundredthsOfCents(balanceInHundredthsOfCents, locale.current);
	});

	$effect(() => {
		const purchaseStatus =
			page.url.searchParams.get('balance_purchase') ?? page.url.searchParams.get('credit_purchase');
		if (!purchaseStatus || purchaseStatus === lastPurchaseStatus) {
			return;
		}
		lastPurchaseStatus = purchaseStatus;
		if (purchaseStatus === 'success') {
			toast.success(t`Payment completed. Your balance will update shortly.`);
		}
		if (purchaseStatus === 'cancelled') {
			toast.info(t`Payment was cancelled.`);
		}
	});

	async function addBalance(amount: number) {
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

	function purchaseCustomAmount() {
		if (!isPurchaseAmountValid || parsedPurchaseAmount === null) {
			toast.error(
				t`Enter a valid amount. Minimum purchase is ${formatUsdAmount(BALANCE_TOP_UP_MIN_USD, locale.current)}.`
			);
			return;
		}
		void addBalance(parsedPurchaseAmount);
	}
</script>

{#if !canManageBilling}
	<ContentLayout rootLink="/settings" {header}>
		<Card.Root>
			<Card.Content class="pt-6">
				<p>
					{t`You don't have permission to add funds. Only organization owners can access this page.`}
				</p>
			</Card.Content>
		</Card.Root>
	</ContentLayout>
{:else}
	<ContentLayout rootLink="/settings" {header}>
		<div class="space-y-6">
			<Card.Root>
				<Card.Header>
					<Card.Title>{t`Account balance`}</Card.Title>
					<Card.Description>
						{t`This balance belongs to your organization and is shared across your workspace.`}
					</Card.Description>
				</Card.Header>
				<Card.Content>
					<p class="text-3xl font-semibold">{formattedBalance}</p>
					<p class="mt-2 text-sm text-muted-foreground">
						{t`Add funds to your balance with Stripe.`}
					</p>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title>{t`Add funds`}</Card.Title>
					<Card.Description
						>{t`Enter an amount in USD to continue in Stripe checkout.`}</Card.Description
					>
				</Card.Header>
				<Card.Content class="space-y-6">
					<div class="flex max-w-sm flex-col gap-4">
						<div class="space-y-2">
							<Label for="balance-purchase-amount">{t`Amount (USD)`}</Label>
							<Input
								id="balance-purchase-amount"
								type="number"
								min={BALANCE_TOP_UP_MIN_USD}
								max={BALANCE_TOP_UP_MAX_USD}
								step="1"
								bind:value={purchaseAmountInput}
								disabled={purchasingAmount !== null}
							/>
							<p class="text-sm text-muted-foreground">
								{t`Minimum purchase: ${formatUsdAmount(BALANCE_TOP_UP_MIN_USD, locale.current)}`}
							</p>
						</div>
						<Button
							disabled={!isPurchaseAmountValid || purchasingAmount !== null}
							onclick={purchaseCustomAmount}
						>
							{#if purchasingAmount !== null && parsedPurchaseAmount !== null && purchasingAmount === parsedPurchaseAmount}
								<Spinner class="mr-2 h-4 w-4" />
								{t`Redirecting...`}
							{:else if parsedPurchaseAmount !== null && isPurchaseAmountValid}
								{t`Add ${formatUsdAmount(parsedPurchaseAmount, locale.current)}`}
							{:else}
								{t`Continue to checkout`}
							{/if}
						</Button>
					</div>

					<div class="space-y-3">
						<p class="text-sm text-muted-foreground">{t`Or choose a preset amount:`}</p>
						<div class="grid gap-3 sm:grid-cols-3">
							{#each BALANCE_TOP_UP_PRESET_AMOUNTS_USD as amount (amount)}
								<Button
									variant="outline"
									disabled={purchasingAmount !== null}
									onclick={() => addBalance(amount)}
								>
									{#if purchasingAmount === amount}
										<Spinner class="mr-2 h-4 w-4" />
										{t`Redirecting...`}
									{:else}
										{formatUsdAmount(amount, locale.current)}
									{/if}
								</Button>
							{/each}
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		</div>
	</ContentLayout>
{/if}

{#snippet header()}
	<div class="flex items-center justify-between">
		<H2>{t`Account balance`}</H2>
	</div>
{/snippet}
