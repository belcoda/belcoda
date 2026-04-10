<script lang="ts">
	import { t } from '$lib/index.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import Avatar from '$lib/components/widgets/avatar/Avatar.svelte';
	import ShareIcon from '@lucide/svelte/icons/share-2';
	import { formatDate } from '$lib/utils/date';
	import PetitionSignupForm from '$lib/components/layouts/public/petition/PetitionSignupForm.svelte';
	import { defaultDisplaySettings } from '$lib/schema/organization/settings';
	import type { SuperValidated } from 'sveltekit-superforms';
	import type { SurveySchema } from '$lib/schema/survey/questions';
	import type { ReadPetitionZero } from '$lib/schema/petition/petition';
	import type { OrganizationSchema } from '$lib/schema/organization';
	import type { ReadPersonZero } from '$lib/schema/person';

	type SerializedPublicPetition = Omit<
		ReadPetitionZero,
		'createdAt' | 'updatedAt' | 'deletedAt' | 'archivedAt'
	> & {
		createdAt: number | null;
		updatedAt: number | null;
		deletedAt: number | null;
		archivedAt: number | null;
	};

	type RecentSignaturePreview = Pick<ReadPersonZero, 'givenName' | 'familyName'> & {
		createdAt?: number | null;
	};

	type Props = {
		data: {
			petition: SerializedPublicPetition;
			organization: OrganizationSchema;
			signatureCount: number;
			recentSignatures?: RecentSignaturePreview[];
			whatsAppSignupLink?: string | null;
		};
		form?: SuperValidated<SurveySchema>;
		layout?: 'default' | 'embed';
		success?: boolean;
	};

	const { data, form, layout = 'default', success = false }: Props = $props();

	const primaryColor = $derived(
		data.organization.settings?.theme?.primaryColor || defaultDisplaySettings.primaryColor
	);

	function formatNumber(num: number): string {
		return num.toLocaleString();
	}

	const petitionSignatureCount = (count: string) => {
		return t`${count} people have signed this petition`;
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
					<PetitionSignupForm
						petition={data.petition}
						organization={data.organization}
						signatureCount={data.signatureCount}
						whatsAppSignupLink={data.whatsAppSignupLink}
						{form}
						{layout}
						{success}
					/>
				</div>
			</div>
		</div>
	</main>
{:else if layout === 'embed'}
	<div class="mx-auto max-w-md bg-white p-6">
		<PetitionSignupForm
			petition={data.petition}
			organization={data.organization}
			signatureCount={data.signatureCount}
			whatsAppSignupLink={data.whatsAppSignupLink}
			{form}
			{layout}
			{success}
		/>
	</div>
{/if}

{#if layout === 'default' && !success}
	<div class="mx-auto mt-4 max-w-5xl px-4 sm:px-6 lg:px-8">
		<Card.Root class="ml-auto w-full lg:w-[calc((100%-2rem)/2)]">
			<Card.Content class="pt-6">
				<Button variant="outline" class="w-full">
					<ShareIcon class="mr-2 size-4" />
					{t`Share this petition`}
				</Button>
			</Card.Content>
		</Card.Root>
	</div>
{/if}
