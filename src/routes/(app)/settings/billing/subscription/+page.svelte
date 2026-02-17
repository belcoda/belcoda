<script lang="ts">
	import { env as publicEnv } from '$env/dynamic/public';
	import { onMount } from 'svelte';
	import { t } from '$lib/index.svelte';
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import { appState } from '$lib/state.svelte';
	import { authClient } from '$lib/auth-client';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import H2 from '$lib/components/ui/typography/H2.svelte';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { toast } from 'svelte-sonner';

	type ActiveSubscription = {
		id: string;
		plan: string;
		status: string;
		periodStart?: string | Date | null;
		periodEnd?: string | Date | null;
		cancelAtPeriodEnd?: boolean | null;
		seats?: number | null;
	};

	const canManageBilling = $derived(appState.isOwner);
	const supportedTierFormUrl = publicEnv.PUBLIC_SUPPORTED_TIER_FORM_URL;
	const enterpriseTierFormUrl = publicEnv.PUBLIC_ENTERPRISE_TIER_FORM_URL;

	let loading = $state(true);
	let openingPortal = $state(false);
	let error = $state<string | null>(null);
	let subscriptions = $state<ActiveSubscription[]>([]);

	const activeSubscription = $derived(subscriptions[0] ?? null);
	const currentPlan = $derived.by(() => {
		const planName = activeSubscription?.plan;
		if (!planName) {
			return t`Free`;
		}
		return `${planName.charAt(0).toUpperCase()}${planName.slice(1)}`;
	});

	const formattedPeriodEnd = $derived.by(() =>
		formatBillingDate(activeSubscription?.periodEnd ?? undefined)
	);

	function formatBillingDate(value: string | Date | null | undefined) {
		if (!value) {
			return t`Not available`;
		}
		const dateValue = typeof value === 'string' ? new Date(value) : value;
		if (Number.isNaN(dateValue.getTime())) {
			return t`Not available`;
		}
		return new Intl.DateTimeFormat('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		}).format(dateValue);
	}

	async function loadSubscriptions() {
		try {
			loading = true;
			error = null;
			const result = await authClient.subscription.list({
				referenceId: appState.organizationId
			});
			if (result.error) {
				throw new Error(result.error.message || t`Failed to load subscription`);
			}
			subscriptions = (result.data ?? []) as ActiveSubscription[];
		} catch (err) {
			error = err instanceof Error ? err.message : t`Failed to load subscription`;
		} finally {
			loading = false;
		}
	}

	async function openStripeBillingPortal() {
		if (openingPortal) {
			return;
		}
		try {
			openingPortal = true;
			const result = await authClient.subscription.billingPortal({
				referenceId: appState.organizationId,
				returnUrl: '/settings/billing/subscription'
			});
			if (result.error || !result.data?.url) {
				throw new Error(result.error?.message || t`Unable to open Stripe billing portal`);
			}
			window.location.href = result.data.url;
		} catch (err) {
			toast.error(err instanceof Error ? err.message : t`Unable to open Stripe billing portal`);
			openingPortal = false;
		}
	}

	function openContactForm(url: string | undefined) {
		if (!url) {
			toast.error(t`Contact form URL is not configured.`);
			return;
		}
		window.open(url, '_blank', 'noopener,noreferrer');
	}

	onMount(() => {
		if (canManageBilling) {
			void loadSubscriptions();
		} else {
			loading = false;
		}
	});
</script>

{#if !canManageBilling}
	<ContentLayout rootLink="/settings" {header}>
		<Card.Root>
			<Card.Content class="pt-6">
				<p>
					{t`You don't have permission to manage billing. Only organization owners can access this page.`}
				</p>
			</Card.Content>
		</Card.Root>
	</ContentLayout>
{:else}
	<ContentLayout rootLink="/settings" {header}>
		<div class="space-y-6">
			<Card.Root>
				<Card.Header>
					<Card.Title>{t`Current subscription`}</Card.Title>
					<Card.Description>
						{t`Your organization's Stripe subscription status and plan information.`}
					</Card.Description>
				</Card.Header>
				<Card.Content>
					{#if loading}
						<div class="flex items-center gap-2 text-muted-foreground">
							<Spinner class="h-4 w-4" />
							<span>{t`Loading subscription...`}</span>
						</div>
					{:else if error}
						<p class="text-destructive">{error}</p>
					{:else}
						<div class="space-y-3">
							<div class="flex items-center justify-between">
								<p class="text-sm text-muted-foreground">{t`Plan`}</p>
								<p class="font-medium">{currentPlan}</p>
							</div>
							<div class="flex items-center justify-between">
								<p class="text-sm text-muted-foreground">{t`Status`}</p>
								<p class="font-medium">
									{activeSubscription?.status ?? t`No active paid subscription`}
								</p>
							</div>
							<div class="flex items-center justify-between">
								<p class="text-sm text-muted-foreground">{t`Current period ends`}</p>
								<p class="font-medium">{formattedPeriodEnd}</p>
							</div>
						</div>
					{/if}
				</Card.Content>
				<Card.Footer class="justify-end">
					<Button
						variant="outline"
						onclick={openStripeBillingPortal}
						disabled={openingPortal || loading}
					>
						{#if openingPortal}
							<Spinner class="mr-2 h-4 w-4" />
							{t`Opening Stripe...`}
						{:else}
							{t`Manage in Stripe`}
						{/if}
					</Button>
				</Card.Footer>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title>{t`Need a different plan?`}</Card.Title>
					<Card.Description>
						{t`Everyone starts on the Free tier. To move to Supported or Enterprise, submit a contact form and our team will follow up.`}
					</Card.Description>
				</Card.Header>
				<Card.Content class="grid gap-3 sm:grid-cols-2">
					<Button variant="outline" onclick={() => openContactForm(supportedTierFormUrl)}>
						{t`Contact us for Supported tier`}
					</Button>
					<Button variant="outline" onclick={() => openContactForm(enterpriseTierFormUrl)}>
						{t`Contact us for Enterprise tier`}
					</Button>
				</Card.Content>
			</Card.Root>
		</div>
	</ContentLayout>
{/if}

{#snippet header()}
	<div class="flex items-center justify-between">
		<H2>{t`Subscription`}</H2>
	</div>
{/snippet}
