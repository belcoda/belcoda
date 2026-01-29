<script lang="ts">
	import { type EventSchema } from '$lib/schema/event';
	import { type OrganizationSchema } from '$lib/schema/organization';
	import { type PersonSchema } from '$lib/schema/person';
	import { renderEventTime } from '$lib/utils/date';
	import { renderAddress } from '$lib/utils/string/address';
	import { page } from '$app/state';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import CalendarDaysIcon from '@lucide/svelte/icons/calendar-days';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import UsersIcon from '@lucide/svelte/icons/users';
	import LinkIcon from '@lucide/svelte/icons/link';
	import type { SurveySchema } from '$lib/schema/survey/questions';
	import type { SuperValidated } from 'sveltekit-superforms';
	import EventSignUpSuccess from '$lib/components/layouts/public/event/EventSignUpSuccess.svelte';
	type Props = {
		event: EventSchema;
		organization: OrganizationSchema;
		signupCount?: number;
		form?: SuperValidated<SurveySchema>;
		whatsAppSignupLink?: string;
		theme: 'default' | 'embed';
		success?: boolean;
	};
	const {
		event,
		organization,
		theme = 'default',
		signupCount = 0,
		whatsAppSignupLink,
		form,
		success = false
	}: Props = $props();

	import { defaultDisplaySettings } from '$lib/schema/organization/settings';
	const primaryColor = $derived(
		organization.settings?.display?.primaryColor || defaultDisplaySettings.primaryColor
	);

	const currentSignups = $derived(signupCount);
	import EventSignupForm from './EventSignupForm.svelte';
	import EventDetails from './EventDetails.svelte';
</script>

<svelte:head>
	<title>{event.title} - {organization.name}</title>
	<meta name="description" content={event.shortDescription} />
	<meta name="robots" content="index, follow" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<meta name="theme-color" content={organization.settings?.display?.primaryColor || '#000000'} />
	{#if organization.icon}
		<link rel="icon" href={organization.icon} />
	{/if}
</svelte:head>
{#if theme === 'default'}
	<main class="min-h-screen bg-gray-50">
		<div
			class="relative h-96 w-full bg-cover bg-center bg-no-repeat"
			style="background-image: url('{event.featureImage || '/ui/placeholder.jpg'}')"
		></div>

		<!-- Main Content -->
		<div class="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
			<div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
				<div class="lg:col-span-1">
					<div class="rounded-lg bg-white p-8 shadow-sm">
						<div class="mb-8 space-y-6">
							<h1 class="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
								{event.title}
							</h1>
							<EventDetails {event} {currentSignups} {primaryColor} />

							{#if event.shortDescription}
								<div class="mt-4">
									<p class="text-lg">{event.shortDescription}</p>
								</div>
							{/if}
						</div>

						{#if event.description}
							<div class="border-t border-gray-200 pt-8">
								<h2 class="mb-4 text-xl font-semibold text-gray-900">What to Expect:</h2>
								<div class="space-y-4 text-gray-700">
									<p>
										{JSON.stringify(event.description)}
									</p>
								</div>
							</div>
						{/if}

						{#if event.settings?.attachments && event.settings.attachments.length > 0}
							<div class="border-t border-gray-200 pt-8">
								<h2 class="mb-4 text-xl font-semibold text-gray-900">Resources:</h2>
								<div class="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
									{#each event.settings.attachments as attachment}
										<a
											href={attachment.link}
											target="_blank"
											rel="noopener noreferrer"
											class="group flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
										>
											{#if attachment.thumbnail}
												<img
													src={attachment.thumbnail}
													alt="Attachment thumbnail"
													class="h-8 w-8 shrink-0 rounded"
												/>
											{:else}
												<div
													class="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-gray-100"
												>
													<LinkIcon class="h-4 w-4 text-gray-500" />
												</div>
											{/if}
											<div class="min-w-0 flex-1">
												<h3 class="font-medium text-gray-900 group-hover:text-blue-600">
													{attachment.title}
												</h3>
												{#if attachment.caption}
													<p class="mt-1 text-sm text-gray-600">{attachment.caption}</p>
												{/if}
											</div>
										</a>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				</div>

				<div class="lg:col-span-1">
					<div class="sticky top-8">
						<div class="rounded-lg bg-white p-6 shadow-sm">
							{#if form && whatsAppSignupLink && !success}
								<EventSignupForm
									{form}
									{currentSignups}
									{event}
									{organization}
									{theme}
									{whatsAppSignupLink}
								/>
							{/if}
							{#if success}
								<EventSignUpSuccess {event} {organization} />
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>
	</main>
{:else if theme === 'embed'}
	<div class="mx-auto max-w-md bg-white">
		{#if form && whatsAppSignupLink && !success}
			<EventSignupForm
				{currentSignups}
				{form}
				{event}
				{organization}
				{theme}
				{whatsAppSignupLink}
			/>
		{/if}
		{#if success}
			<EventSignUpSuccess {event} {organization} />
		{/if}
	</div>
{/if}
