<script lang="ts">
	import { t } from '$lib/index.svelte';
	import { type EventSchema } from '$lib/schema/event';
	import type { OrganizationSchema } from '$lib/schema/organization';
	import { renderEventTime } from '$lib/utils/date';
	import { renderAddress } from '$lib/utils/string/address';
	import { page } from '$app/state';
	import { defaultDisplaySettings } from '$lib/schema/organization/settings';
	import { type Infer, superForm, type SuperValidated } from 'sveltekit-superforms';
	import SuperDebug from '$lib/components/ui/form/custom/debug.svelte';
	import RenderError from '$lib/components/ui/form/custom/error.svelte';
	import { valibot } from 'sveltekit-superforms/adapters';
	import { type SurveySchema, getSurveySchema } from '$lib/schema/survey/questions';
	type Props = {
		theme: 'default' | 'embed';
		event: EventSchema;
		organization: OrganizationSchema;
		currentSignups: number;
		session?: App.Locals['session'] | null;
		whatsAppSignupLink: string;
		form: SuperValidated<SurveySchema>;
	};

	const {
		event,
		organization,
		currentSignups,
		whatsAppSignupLink,
		session,
		form: formProp,
		theme = 'default'
	}: Props = $props();

	const primaryColor = $derived(
		organization.settings?.theme?.primaryColor || defaultDisplaySettings.primaryColor
	); // purple/indigo default
	const secondaryColor = $derived(
		organization.settings?.theme?.secondaryColor || defaultDisplaySettings.secondaryColor
	); // Green default

	const eventTimeData = $derived(
		renderEventTime(
			event.startsAt.getTime(),
			event.endsAt.getTime(),
			page.data.locale,
			event.timezone
		)
	);

	import {
		type PersonActionHelper,
		personActionHelper,
		setRequiredPersonActionHelperFieldsBasedOnSurveyQuestions
	} from '$lib/schema/person';
	import createForm from '$lib/form.svelte';
	import { parse, object } from 'valibot';
	import { convertQuestionsToValibotSchema } from '$lib/schema/survey/questions';
	import { renderPersonQuestion } from '$lib/components/forms/event/render_survey_question';
	import { getSurveyQuestions } from '$lib/components/forms/event/survey_actions';
	const { person: personSurveyQuestionsRaw, custom: customSurveyQuestions } = getSurveyQuestions(
		event.settings.survey.collections[0].questions
	);
	const personSurveyQuestions = personSurveyQuestionsRaw.map((item) => item.type);
	const customQuestionSurveySchema = object(convertQuestionsToValibotSchema(customSurveyQuestions));
	const personActionHelperSchema = setRequiredPersonActionHelperFieldsBasedOnSurveyQuestions(
		personActionHelper,
		customSurveyQuestions
	);
	//create the schema for the form (this will be a dynamic schema based on the survey questions)
	const schema = object({
		person: personActionHelperSchema, //include the added additional person fields
		customFields: customQuestionSurveySchema //include the custom fields from the survey
	});
	let submissionError: string | null = $state(null);
	let submissionSuccess: boolean = $state(false);
	import WhatsAppSignup from './WhatsAppSignup.svelte';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import PhoneNumber from '$lib/components/ui/custom-select/phone-number/phone-number.svelte';
	import GenderSelect from '$lib/components/ui/custom-select/gender/gender.svelte';
	import LanguageSelect from '$lib/components/ui/custom-select/language/language.svelte';
	import type { GenderOption } from '$lib/utils/person';
	import type { LanguageCode } from '$lib/utils/language';
	import type { CountryCode } from '$lib/utils/country';
	import CountrySelect from '$lib/components/ui/custom-select/country/country.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import AddToCalendarDropdown from './AddToCalendarDropdown.svelte';
	import PhoneNumberInput from '$lib/components/ui/custom-select/phone-number/phone-number.svelte';
	import DateOfBirth from '$lib/components/ui/custom-select/date-of-birth/date-of-birth.svelte';
	import { Spinner } from '$lib/components/ui/spinner/index';

	//icons
	import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import X from '@lucide/svelte/icons/x';
	import Error from '$lib/components/ui/form/custom/error.svelte';
	import EventDetails from './EventDetails.svelte';

	//form helperrs

	const surveySchema = getSurveySchema(event);
	const form = superForm(formProp, {
		validators: valibot(surveySchema),
		dataType: 'json',
		delayMs: 200,
		timeoutMs: 12000
	});
	const { form: data, submitting, delayed, allErrors } = $derived(form);
</script>

<!-- Registration Form -->
{#if event.published || session?.session.id}
	<div>
		<!-- If the event is not published, show a warning. It will only be visible if a user with event permissions is signed in because this page won't be visible otherwise -->
		{#if !event.published}
			<div class="mb-6 rounded-md bg-yellow-50 p-3">
				<p class="text-sm text-yellow-700">
					{t`This is a preview of the event. Publish the event before sharing it with others.`}
				</p>
			</div>
		{/if}
		{#if theme === 'default'}
			<h3 class="mb-6 text-lg font-semibold text-gray-900">{t`Join this event`}</h3>
		{:else if theme === 'embed'}
			<div class="mb-6">
				<h3 class="mb-2 text-lg font-semibold text-gray-900">{event.title}</h3>
				<p class="mb-2 text-sm text-gray-600">{event.shortDescription}</p>
				<EventDetails {event} {currentSignups} {primaryColor} />
			</div>
		{/if}

		<div class="mb-6 lg:hidden">
			<WhatsAppSignup directLink {whatsAppSignupLink} />
		</div>

		<form use:form.enhance class="space-y-4" method="POST">
			{#if submissionError}
				<div class="rounded-md bg-red-50 p-3">
					<div class="text-sm text-red-700">{submissionError}</div>
				</div>
			{/if}

			<RenderError errors={allErrors} />

			<div class="grid grid-cols-2 gap-2">
				<Form.Field {form} name="person.givenName">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>{t`Given name`}</Form.Label>
							<Input {...props} bind:value={$data.person.givenName} />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="person.familyName">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>{t`Family name`}</Form.Label>
							<Input {...props} bind:value={$data.person.familyName} />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>
			<Form.Field {form} name="person.emailAddress">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>{t`Email address`}</Form.Label>
						<Input {...props} bind:value={$data.person.emailAddress} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="person.phoneNumber">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>{t`Phone number`}</Form.Label>
						<PhoneNumber
							{...props}
							country={$data.person.country}
							bind:value={$data.person.phoneNumber}
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			{#if personSurveyQuestions.includes('person.address')}
				<!--Can't use renderPersonQuestion here because the address-->
				<Form.Field {form} name="person.addressLine1">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>{t`Address line 1`}</Form.Label>
							<Input {...props} bind:value={$data.person.addressLine1} />
						{/snippet}
					</Form.Control>
				</Form.Field>
				<Form.Field {form} name="person.addressLine2">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>{t`Address line 2 (optional)`}</Form.Label>
							<Input {...props} bind:value={$data.person.addressLine2} />
						{/snippet}
					</Form.Control>
				</Form.Field>
				<div class="grid grid-cols-2 gap-2">
					<Form.Field {form} name="person.locality">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>{t`Locality`}</Form.Label>
								<Input {...props} bind:value={$data.person.locality} />
							{/snippet}
						</Form.Control>
					</Form.Field>
					<Form.Field {form} name="person.region">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>{t`Region`}</Form.Label>
								<Input {...props} bind:value={$data.person.region} />
							{/snippet}
						</Form.Control>
					</Form.Field>
					<Form.Field {form} name="person.postcode">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>{t`Postcode`}</Form.Label>
								<Input {...props} bind:value={$data.person.postcode} />
							{/snippet}
						</Form.Control>
					</Form.Field>
					<Form.Field {form} name="person.country">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>{t`Country`}</Form.Label>
								<CountrySelect {...props} bind:value={$data.person.country as CountryCode} />
							{/snippet}
						</Form.Control>
					</Form.Field>
				</div>
			{/if}

			{#if personSurveyQuestions.includes('person.dateOfBirth')}
				<Form.Field {form} name="person.dateOfBirth">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>{renderPersonQuestion('person.dateOfBirth')}</Form.Label>
							<DateOfBirth {...props} bind:value={$data.person.dateOfBirth} />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			{/if}

			{#if personSurveyQuestions.includes('person.gender')}
				<Form.Field {form} name="person.gender">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>{renderPersonQuestion('person.gender')}</Form.Label>
							<GenderSelect {...props} bind:value={$data.person.gender as GenderOption} />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			{/if}

			{#if personSurveyQuestions.includes('person.workplace')}
				<Form.Field {form} name="person.workplace">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>{renderPersonQuestion('person.workplace')}</Form.Label>
							<Input {...props} bind:value={$data.person.workplace} />
						{/snippet}
					</Form.Control>
				</Form.Field>
			{/if}

			{#if personSurveyQuestions.includes('person.position')}
				<Form.Field {form} name="person.position">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>{renderPersonQuestion('person.position')}</Form.Label>
							<Input {...props} bind:value={$data.person.position} />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			{/if}

			<!-- Custom Fields -->
			{#if customSurveyQuestions.length > 0}
				{#each customSurveyQuestions as field, i}
					{#if field.type === 'custom.textInput'}
						<Form.Field {form} name={`customFields.${field.id}`}>
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>{field.label}</Form.Label>
									<Input type="text" {...props} bind:value={$data.customFields[field.id]} />
								{/snippet}
							</Form.Control>
						</Form.Field>
					{:else if field.type === 'custom.textarea'}
						<Form.Field {form} name={`customFields.${field.id}`}>
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>{field.label}</Form.Label>
									<Input type="textarea" {...props} bind:value={$data.customFields[field.id]} />
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
					{:else if field.type === 'custom.dateInput'}
						<Form.Field {form} name={`customFields.${field.id}`}>
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>{field.label}</Form.Label>
									<Input type="date" {...props} bind:value={$data.customFields[field.id]} />
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
					{:else if field.type === 'custom.emailInput'}
						<Form.Field {form} name={`customFields.${field.id}`}>
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>{field.label}</Form.Label>
									<Input type="email" {...props} bind:value={$data.customFields[field.id]} />
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
					{:else if field.type === 'custom.phoneInput'}
						<Form.Field {form} name={`customFields.${field.id}`}>
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>{field.label}</Form.Label>
									<PhoneNumberInput
										country={$data.person.country}
										{...props}
										bind:value={$data.customFields[field.id]}
									/>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
					{:else if field.type === 'custom.numberInput'}
						<Form.Field {form} name={`customFields.${field.id}`}>
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>{field.label}</Form.Label>
									<Input type="number" {...props} bind:value={$data.customFields[field.id]} />
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
					{/if}
				{/each}
			{/if}

			<div class="mt-4 flex flex-col gap-3">
				<Button type="submit" class="w-full" disabled={$submitting}>
					{#if $delayed}<Spinner class="size-4" />{/if}
					{t`Sign up now`}</Button
				>
				<div class="hidden lg:block">
					<WhatsAppSignup {whatsAppSignupLink} />
				</div>
				<Button type="button" variant="ghost" class="w-full" disabled={$submitting}
					>{t`I can't attend`}</Button
				>
			</div>

			<SuperDebug {data} />
		</form>
	</div>
{:else}
	<div class="text-center">
		<div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
			<AlertTriangle class="h-6 w-6 text-yellow-600" />
		</div>
		<h3 class="mt-4 text-lg font-medium text-gray-900">{t`Event not published`}</h3>
		<p class="mt-2 text-sm text-gray-600">
			{t`This event is not published yet. Please check back later.`}
		</p>
	</div>
{/if}

{#snippet submissionFailed()}
	<div class="p-6 text-center">
		<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
			<X class="h-8 w-8 text-red-600" />
		</div>
		<h3 class="mb-4 text-xl font-semibold text-gray-900">{t`Not joining this event`}</h3>

		<p class="mb-2 text-sm text-gray-600">{t`You declined an invitation to`}</p>

		<div class="mb-4 space-y-2 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
			<h4 class="mb-4 text-lg font-medium text-gray-900">{event.title}</h4>
			<div class="flex items-center justify-center space-x-2">
				<CalendarDays class="h-4 w-4 text-gray-600" />
				<span>{eventTimeData.dateStr} - {eventTimeData.timeStr}</span>
			</div>
			{#if event.addressLine1}
				<div class="flex items-start justify-center space-x-2">
					<MapPin class="h-4 w-4 shrink-0 text-gray-600" />
					<span>
						{renderAddress({
							addressLine1: event.addressLine1,
							addressLine2: event.addressLine2,
							locality: event.locality,
							region: event.region,
							postcode: event.postcode,
							country: event.country,
							locale: page.data.locale
						})}
					</span>
				</div>
			{/if}
		</div>

		<p class="mb-6 text-sm text-gray-600">{t`We'll let the organiser know you can't attend.`}</p>
	</div>
{/snippet}
