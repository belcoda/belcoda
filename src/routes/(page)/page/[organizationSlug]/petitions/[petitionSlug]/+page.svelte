<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Progress } from '$lib/components/ui/progress/index.js';
	import Avatar from '$lib/components/widgets/avatar/Avatar.svelte';
	import PenLineIcon from '@lucide/svelte/icons/pen-line';
	import EditIcon from '@lucide/svelte/icons/edit';
	import ShareIcon from '@lucide/svelte/icons/share-2';

	const { data } = $props();

	// Calculate dynamic target (similar to change.org)
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

		// If we've exceeded all milestones, use the next round number
		return Math.ceil(currentSignatures / 100000) * 100000;
	}

	const currentTarget = $derived(calculateTarget(data.signatureCount));
	const progress = $derived((data.signatureCount / currentTarget) * 100);

	// Format numbers with commas
	function formatNumber(num: number): string {
		return num.toLocaleString();
	}

	let signingInProgress = $state(false);
	let formData = $state({
		givenName: '',
		familyName: '',
		emailAddress: '',
		phoneNumber: '',
		comment: ''
	});

	async function handleSignPetition() {
		signingInProgress = true;
		// TODO: Implement actual signing logic
		await new Promise((resolve) => setTimeout(resolve, 1000));
		signingInProgress = false;
	}
</script>

<div class="min-h-screen bg-background">
	<!-- Hero Section -->
	<div class="border-b bg-muted/30">
		<div class="container mx-auto max-w-6xl px-4 py-8">
			{#if data.isAdmin}
				<div class="mb-4 flex justify-end gap-2">
					<Button variant="outline" size="sm" href={`/petitions/${data.petition.id}`}>
						<EditIcon class="size-4" />
						Edit
					</Button>
					<Button variant="outline" size="sm">
						<ShareIcon class="size-4" />
						Share
					</Button>
				</div>
			{/if}

			{#if data.petition.featureImage}
				<img
					src={data.petition.featureImage}
					alt={data.petition.title}
					class="mb-6 aspect-video w-full rounded-lg object-cover shadow-lg"
				/>
			{/if}

			<div>
				<h1 class="mb-2 text-3xl font-bold md:text-4xl">{data.petition.title}</h1>
				{#if data.petition.petitionTarget}
					<p class="text-lg text-muted-foreground">To: {data.petition.petitionTarget}</p>
				{/if}
			</div>
		</div>
	</div>

	<div class="container mx-auto max-w-6xl px-4 py-8">
		<div class="grid gap-8 lg:grid-cols-3">
			<div class="lg:col-span-2">
				<Card.Root>
					<Card.Header>
						<Card.Title>Petition Details</Card.Title>
					</Card.Header>
					<Card.Content class="prose max-w-none">
						{#if data.petition.shortDescription}
							<p class="text-lg leading-relaxed">{data.petition.shortDescription}</p>
						{/if}
						{#if data.petition.petitionText}
							<div class="mt-4 whitespace-pre-wrap">{data.petition.petitionText}</div>
						{/if}
					</Card.Content>
				</Card.Root>

				<Card.Root class="mt-8">
					<Card.Header>
						<Card.Title>Recent Signatures</Card.Title>
					</Card.Header>
					<Card.Content>
						<div class="space-y-4">
							<!-- TODO: Add actual signatures list -->
							<p class="text-sm text-muted-foreground">
								{formatNumber(data.signatureCount)} people have signed this petition
							</p>
						</div>
					</Card.Content>
				</Card.Root>
			</div>

			<div class="lg:col-span-1">
				<div class="sticky top-4">
					<Card.Root>
						<Card.Header>
							<div class="space-y-4">
								<div>
									<div class="mb-2 flex items-baseline justify-between">
										<div>
											<div class="text-3xl font-bold">{formatNumber(data.signatureCount)}</div>
											<div class="text-xs tracking-wide text-muted-foreground uppercase">
												signatures
											</div>
										</div>
										<div class="text-right">
											<div class="text-lg font-semibold">
												{Math.round(progress)}%
											</div>
											<div class="text-xs text-muted-foreground">of goal</div>
										</div>
									</div>
									<Progress value={progress} class="h-2.5" />
									<div class="mt-1 text-right text-xs text-muted-foreground">
										Goal: {formatNumber(currentTarget)}
									</div>
								</div>

								{#if data.signatureCount > 0}
									<div
										class="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-primary"
									>
										{#if data.signatureCount >= currentTarget}
											<div class="flex items-start gap-2">
												<span class="text-lg">🎉</span>
												<div>
													<strong>Goal reached!</strong> Keep the momentum going to make an even bigger
													impact.
												</div>
											</div>
										{:else}
											<strong>{formatNumber(currentTarget - data.signatureCount)}</strong> more
											signatures needed to reach {formatNumber(currentTarget)}
										{/if}
									</div>
								{/if}
							</div>
						</Card.Header>

						<Card.Content>
							<form onsubmit={handleSignPetition} class="space-y-4">
								<div class="space-y-2">
									<Label for="givenName">First name</Label>
									<Input
										id="givenName"
										bind:value={formData.givenName}
										placeholder="First name"
										required
									/>
								</div>

								<div class="space-y-2">
									<Label for="familyName">Last name</Label>
									<Input
										id="familyName"
										bind:value={formData.familyName}
										placeholder="Last name"
										required
									/>
								</div>

								<div class="space-y-2">
									<Label for="emailAddress">Email</Label>
									<Input
										id="emailAddress"
										type="email"
										bind:value={formData.emailAddress}
										placeholder="your@email.com"
										required
									/>
								</div>

								<div class="space-y-2">
									<Label for="phoneNumber">Phone (optional)</Label>
									<Input
										id="phoneNumber"
										type="tel"
										bind:value={formData.phoneNumber}
										placeholder="+1234567890"
									/>
								</div>

								<div class="space-y-2">
									<Label for="comment">Comment (optional)</Label>
									<Textarea
										id="comment"
										bind:value={formData.comment}
										placeholder="Why are you signing this petition?"
										class="min-h-[80px]"
									/>
								</div>

								<Button type="submit" class="w-full" size="lg" disabled={signingInProgress}>
									<PenLineIcon class="mr-2 size-5" />
									{signingInProgress ? 'Signing...' : 'Sign this petition'}
								</Button>

								<p class="text-xs text-muted-foreground">
									By signing, you agree to receive updates about this petition and related
									campaigns.
								</p>
							</form>
						</Card.Content>
					</Card.Root>

					<Card.Root class="mt-4">
						<Card.Content class="pt-6">
							<Button variant="outline" class="w-full">
								<ShareIcon class="mr-2 size-4" />
								Share this petition
							</Button>
						</Card.Content>
					</Card.Root>
				</div>
			</div>
		</div>
	</div>
</div>
