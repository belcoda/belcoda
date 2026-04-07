<script lang="ts">
	import { t } from '$lib/index.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Progress } from '$lib/components/ui/progress/index.js';
	import Avatar from '$lib/components/widgets/avatar/Avatar.svelte';
	import PenLineIcon from '@lucide/svelte/icons/pen-line';
	import ShareIcon from '@lucide/svelte/icons/share-2';
	import { enhance } from '$app/forms';
	import { formatDate } from '$lib/utils/date';
	import WhatsAppPetitionSignup from './WhatsAppPetitionSignup.svelte';
	import PetitionSignSuccess from '$lib/components/layouts/public/petition/PetitionSignSuccess.svelte';
	import { defaultDisplaySettings } from '$lib/schema/organization/settings';

	type PublicPetition = {
		title: string;
		shortDescription: string;
		description?: string | null;
		petitionTarget?: string | null;
		petitionText?: string | null;
		featureImage?: string | null;
	};
	type PublicOrg = {
		name: string;
		icon?: string | null;
		settings?: {
			theme?: {
				primaryColor?: string | null;
				secondaryColor?: string | null;
			} | null;
		} | null;
	};

	const {
		data,
		form,
		layout = 'default',
		success = false
	}: {
		data: {
			petition: PublicPetition;
			organization: PublicOrg;
			signatureCount: number;
			recentSignatures?: {
				givenName?: string | null;
				familyName?: string | null;
				createdAt?: number | null;
			}[];
			whatsAppSignupLink?: string | null;
		};
		form?: { error?: string; success?: boolean } | null;
		layout?: 'default' | 'embed';
		success?: boolean;
	} = $props();

	const primaryColor = $derived(
		data.organization.settings?.theme?.primaryColor || defaultDisplaySettings.primaryColor
	);

	function calculateTarget(currentSignatures: number): number {
		const milestones = [
			100, 200, 500, 1000, 1500, 2000, 2500, 5000, 7500, 10000, 15000, 20000, 25000, 50000, 75000,
			100000, 150000, 200000, 250000, 500000, 1000000
		];

		for (const milestone of milestones) {
			if (currentSignatures < milestone) {
				return milestone;
			}
		}

		return Math.ceil(currentSignatures / 100000) * 100000;
	}

	const currentTarget = $derived(calculateTarget(data.signatureCount));
	const progress = $derived((data.signatureCount / currentTarget) * 100);

	function formatNumber(num: number): string {
		return num.toLocaleString();
	}

	let signingInProgress = $state(false);
	let formValues = $state({
		givenName: '',
		familyName: '',
		emailAddress: '',
		phoneNumber: ''
	});

	const petitionSignatureCount = (count: string) => {
		return t`${count} people have signed this petition`;
	};

	const targetToGoal = (current: string, target: string) => {
		return t`${current} more signatures needed to reach ${target}`;
	};
</script>

<svelte:head>
	<title>{data.petition.title} - {data.organization.name}</title>
	<meta name="description" content={data.petition.shortDescription} />
	<meta name="robots" content="index, follow" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<meta name="theme-color" content={primaryColor} />
	{#if data.organization.icon}
		<link rel="icon" href={data.organization.icon} />
	{/if}
</svelte:head>

{#if layout === 'default'}
	<main class="min-h-screen bg-gray-50">
		<div
			class="relative h-96 w-full bg-cover bg-center bg-no-repeat"
			style="background-image: url('{data.petition.featureImage || '/ui/placeholder.jpg'}')"
		></div>

		<div class="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
			<div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
				<div class="lg:col-span-1">
					<div class="rounded-lg bg-white p-8 shadow-sm">
						<div class="mb-8 space-y-6">
							<h1 class="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
								{data.petition.title}
							</h1>

							{#if data.petition.petitionTarget}
								<p class="text-lg text-muted-foreground">{t`To:`} {data.petition.petitionTarget}</p>
							{/if}

							{#if data.petition.shortDescription}
								<div class="mt-4">
									<p class="text-lg">{data.petition.shortDescription}</p>
								</div>
							{/if}
						</div>

						{#if data.petition.description}
							<div class="border-t border-gray-200 pt-8">
								<h2 class="mb-4 text-xl font-semibold text-gray-900">{t`About this petition`}</h2>
								<div class="prose decorate-links space-y-4 text-gray-700">
									<!-- Sanitized using dompurify on the server -->
									{@html data.petition.description}
								</div>
							</div>
						{/if}

						{#if data.petition.petitionText}
							<div class="border-t border-gray-200 pt-8">
								<h2 class="mb-4 text-xl font-semibold text-gray-900">{t`Petition Statement`}</h2>
								<div class="prose decorate-links space-y-4 whitespace-pre-wrap text-gray-700">
									{data.petition.petitionText}
								</div>
							</div>
						{/if}

						{#if data.recentSignatures && data.recentSignatures.length > 0}
							<div class="border-t border-gray-200 pt-8">
								<h2 class="mb-4 text-xl font-semibold text-gray-900">{t`Recent Signatures`}</h2>
								<p class="mb-4 text-sm text-muted-foreground">
									{petitionSignatureCount(formatNumber(data.signatureCount))}
								</p>
								<div class="space-y-3">
									{#each data.recentSignatures as signature}
										<div class="flex items-start gap-3 border-b pb-3 last:border-0 last:pb-0">
											<Avatar
												name1={signature.givenName || ''}
												name2={signature.familyName}
												class="mt-0.5 size-8"
											/>
											<div class="min-w-0 flex-1">
												<div class="flex items-baseline justify-between gap-2">
													<p class="text-sm font-medium">
														{signature.givenName}
														{signature.familyName}
													</p>
													{#if signature.createdAt}
														<time class="text-xs whitespace-nowrap text-muted-foreground">
															{formatDate(signature.createdAt)}
														</time>
													{/if}
												</div>
											</div>
										</div>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				</div>

				<div class="lg:col-span-1">
					{@render signatureForm()}
				</div>
			</div>
		</div>
	</main>
{:else if layout === 'embed'}
	<div class="mx-auto max-w-md bg-white p-6">
		{@render signatureForm()}
	</div>
{/if}

{#snippet signatureForm()}
	<div class="sticky top-8">
		<div class="rounded-lg bg-white p-6 shadow-sm">
			{#if layout === 'embed'}
				<div class="mb-4">
					<h3 class="text-lg font-semibold">{data.petition.title}</h3>
					{#if data.petition.shortDescription}
						<p class="text-sm text-muted-foreground">{data.petition.shortDescription}</p>
					{/if}
				</div>
			{/if}

			{#if !success}
				<div class="mb-6 space-y-4">
					<div class="flex items-baseline justify-between">
						<div>
							<div class="text-3xl font-bold">{formatNumber(data.signatureCount)}</div>
							<div class="text-xs tracking-wide text-muted-foreground uppercase">
								{t`signatures`}
							</div>
						</div>
						<div class="text-right">
							<div class="text-lg font-semibold">{Math.round(progress)}%</div>
							<div class="text-xs text-muted-foreground">{t`of goal`}</div>
						</div>
					</div>
					<Progress value={progress} class="h-2.5" />
					<div class="text-right text-xs text-muted-foreground">
						{t`Goal: ${formatNumber(currentTarget)}`}
					</div>

					{#if data.signatureCount > 0}
						<div class="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-primary">
							{#if data.signatureCount >= currentTarget}
								<div class="flex items-start gap-2">
									<span class="text-lg">🎉</span>
									<div>
										{t`Goal reached! Keep the momentum going to make an even bigger impact.`}
									</div>
								</div>
							{:else}
								{targetToGoal(
									formatNumber(currentTarget - data.signatureCount),
									formatNumber(currentTarget)
								)}
							{/if}
						</div>
					{/if}
				</div>
			{/if}

			{#if success}
				<PetitionSignSuccess petition={data.petition} organization={data.organization} />
			{:else}
				<form
					method="POST"
					action="?/sign"
					class="space-y-4"
					use:enhance={() => {
						signingInProgress = true;
						return async ({ update }) => {
							await update();
							signingInProgress = false;
						};
					}}
				>
					<input type="hidden" name="layout" value={layout} />

					{#if form?.error}
						<div
							class="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
						>
							{form.error}
						</div>
					{/if}

					<div class="space-y-2">
						<Label for="givenName">{t`First name`}</Label>
						<Input
							id="givenName"
							name="givenName"
							bind:value={formValues.givenName}
							placeholder={t`First name`}
							required
							disabled={signingInProgress}
						/>
					</div>

					<div class="space-y-2">
						<Label for="familyName">{t`Last name`}</Label>
						<Input
							id="familyName"
							name="familyName"
							bind:value={formValues.familyName}
							placeholder={t`Last name`}
							required
							disabled={signingInProgress}
						/>
					</div>

					<div class="space-y-2">
						<Label for="emailAddress">{t`Email`}</Label>
						<Input
							id="emailAddress"
							name="emailAddress"
							type="email"
							bind:value={formValues.emailAddress}
							placeholder={t`your@email.com`}
							required
							disabled={signingInProgress}
						/>
					</div>

					<div class="space-y-2">
						<Label for="phoneNumber">{t`Phone (optional)`}</Label>
						<Input
							id="phoneNumber"
							name="phoneNumber"
							type="tel"
							bind:value={formValues.phoneNumber}
							placeholder="+1234567890"
							disabled={signingInProgress}
						/>
					</div>

					<Button type="submit" class="w-full" size="lg" disabled={signingInProgress}>
						<PenLineIcon class="mr-2 size-5" />
						{signingInProgress ? t`Signing...` : t`Sign this petition`}
					</Button>

					{#if data.whatsAppSignupLink}
						<div class="flex items-center gap-2 py-2">
							<div class="h-px flex-1 bg-gray-200"></div>
							<span class="text-xs text-muted-foreground">{t`or`}</span>
							<div class="h-px flex-1 bg-gray-200"></div>
						</div>
						<WhatsAppPetitionSignup whatsAppSignupLink={data.whatsAppSignupLink} />
					{/if}

					<p class="text-xs text-muted-foreground">
						{t`By signing, you agree to receive updates about this petition and related campaigns.`}
					</p>
				</form>
			{/if}
		</div>

		{#if layout === 'default' && !success}
			<Card.Root class="mt-4">
				<Card.Content class="pt-6">
					<Button variant="outline" class="w-full">
						<ShareIcon class="mr-2 size-4" />
						{t`Share this petition`}
					</Button>
				</Card.Content>
			</Card.Root>
		{/if}
	</div>
{/snippet}
