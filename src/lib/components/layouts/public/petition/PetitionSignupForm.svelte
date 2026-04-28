<script lang="ts">
	import { t } from '$lib/index.svelte';
	import { Progress } from '$lib/components/ui/progress/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import PenLineIcon from '@lucide/svelte/icons/pen-line';
	import WhatsAppPetitionSignup from './WhatsAppPetitionSignup.svelte';
	import PetitionSignSuccess from '$lib/components/layouts/public/petition/PetitionSignSuccess.svelte';
	import { defaults, type SuperValidated, superForm } from 'sveltekit-superforms';
	import { valibot } from 'sveltekit-superforms/adapters';
	import {
		type SurveyQuestion,
		type SurveySchema,
		getSurveySchema,
		renderQuestionTypeName
	} from '$lib/schema/survey/questions';
	import { getSurveyQuestions } from '$lib/components/forms/event/survey_actions';
	import { renderPersonQuestion } from '$lib/components/forms/event/render_survey_question';
	import * as Form from '$lib/components/ui/form/index.js';
	import type { CountryCode } from '$lib/utils/country';
	import CountrySelect from '$lib/components/ui/custom-select/country/country.svelte';
	import GenderSelect from '$lib/components/ui/custom-select/gender/gender.svelte';
	import type { GenderOption } from '$lib/utils/person';
	import DateOfBirth from '$lib/components/ui/custom-select/date-of-birth/date-of-birth.svelte';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import PhoneNumberInput from '$lib/components/ui/custom-select/phone-number/phone-number.svelte';
	import RenderError from '$lib/components/ui/form/custom/error.svelte';
	import { page } from '$app/state';
	import { Spinner } from '$lib/components/ui/spinner/index';
	import type { ReadPetitionZero } from '$lib/schema/petition/petition';
	import type { OrganizationSchema } from '$lib/schema/organization';

	type PetitionSignupFormPetition = Pick<
		ReadPetitionZero,
		'title' | 'shortDescription' | 'petitionTarget' | 'settings'
	>;
	type PetitionSignupFormOrganization = Pick<OrganizationSchema, 'name' | 'settings'>;

	const {
		petition,
		organization,
		signatureCount,
		whatsAppSignupLink,
		form,
		layout = 'default',
		success = false
	}: {
		petition: PetitionSignupFormPetition;
		organization: PetitionSignupFormOrganization;
		signatureCount: number;
		whatsAppSignupLink?: string | null;
		form?: SuperValidated<SurveySchema>;
		layout?: 'default' | 'embed';
		success?: boolean;
	} = $props();

	function calculateTarget(currentSignatures: number): number {
		const milestones = [
			100, 200, 500, 1000, 1500, 2000, 2500, 5000, 7500, 10000, 15000, 20000, 25000, 50000, 75000,
			100000, 150000, 200000, 250000, 500000, 1000000
		];

		for (const milestone of milestones) {
			if (currentSignatures <= milestone) {
				return milestone;
			}
		}

		return Math.ceil(currentSignatures / 100000) * 100000;
	}

	function formatNumber(num: number): string {
		return num.toLocaleString();
	}

	const currentTarget = $derived(calculateTarget(signatureCount));
	const progress = $derived((signatureCount / currentTarget) * 100);

	const surveyQuestions = $derived(
		(petition.settings?.survey?.collections?.[0]?.questions ?? []) as SurveyQuestion[]
	);
	const surveyQuestionsSplit = $derived(getSurveyQuestions(surveyQuestions));
	const personSurveyQuestionsRaw = $derived(surveyQuestionsSplit.person);
	const customSurveyQuestions = $derived(surveyQuestionsSplit.custom);
	const personSurveyQuestions = $derived(personSurveyQuestionsRaw.map((item) => item.type));

	/* svelte-ignore state_referenced_locally */
	const surveySchema = getSurveySchema({ settings: petition.settings });
	/* svelte-ignore state_referenced_locally */
	const petitionForm = superForm(form ?? defaults(valibot(surveySchema)), {
		validators: valibot(surveySchema),
		dataType: 'json',
		delayMs: 200,
		timeoutMs: 12000
	});
	const { form: dataForm, submitting, delayed, allErrors } = $derived(petitionForm);

	$effect(() => {
		$dataForm.customFields ||= {};
	});

	const targetToGoal = (current: string, target: string) => {
		return t`${current} more signatures needed to reach ${target}`;
	};
</script>

<div class="sticky top-8">
	<div class="rounded-lg bg-white p-6 shadow-sm">
		{#if layout === 'embed'}
			<div class="mb-4">
				<h3 class="text-lg font-semibold">{petition.title}</h3>
				{#if petition.shortDescription}
					<p class="text-sm text-muted-foreground">{petition.shortDescription}</p>
				{/if}
			</div>
		{/if}

		{#if !success}
			<div class="mb-6 space-y-4">
				<div class="flex items-baseline justify-between">
					<div>
						<div class="text-3xl font-bold">{formatNumber(signatureCount)}</div>
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

				{#if signatureCount > 0}
					<div class="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-primary">
						{#if signatureCount >= currentTarget}
							<div class="flex items-start gap-2">
								<span class="text-lg">🎉</span>
								<div>{t`Goal reached! Keep the momentum going to make an even bigger impact.`}</div>
							</div>
						{:else}
							{targetToGoal(
								formatNumber(currentTarget - signatureCount),
								formatNumber(currentTarget)
							)}
						{/if}
					</div>
				{/if}
			</div>
		{/if}

		{#if success}
			<PetitionSignSuccess {petition} {organization} />
		{:else}
			<form method="POST" action="?/sign" class="space-y-4" use:petitionForm.enhance>
				<input type="hidden" name="theme" value={layout} />

				<RenderError errors={allErrors} />

				<div class="grid grid-cols-2 gap-2">
					<Form.Field form={petitionForm} name="person.givenName">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>{t`Given name`}</Form.Label>
								<Input
									{...props}
									bind:value={$dataForm.person.givenName}
									data-testid="petition-signup-given-name"
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field form={petitionForm} name="person.familyName">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>{t`Family name`}</Form.Label>
								<Input
									{...props}
									bind:value={$dataForm.person.familyName}
									data-testid="petition-signup-family-name"
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				</div>

				<Form.Field form={petitionForm} name="person.emailAddress">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>{t`Email address`}</Form.Label>
							<Input
								{...props}
								type="email"
								bind:value={$dataForm.person.emailAddress}
								data-testid="petition-signup-email"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field form={petitionForm} name="person.phoneNumber">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>{t`Phone number`}</Form.Label>
							<PhoneNumberInput
								{...props}
								country={$dataForm.person.country}
								bind:value={$dataForm.person.phoneNumber}
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				{#if personSurveyQuestions.includes('person.address')}
					<Form.Field form={petitionForm} name="person.addressLine1">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>{t`Address line 1`}</Form.Label>
								<Input
									{...props}
									bind:value={$dataForm.person.addressLine1}
									data-testid="signup-address-line1"
								/>
							{/snippet}
						</Form.Control>
					</Form.Field>
					<Form.Field form={petitionForm} name="person.addressLine2">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>{t`Address line 2 (optional)`}</Form.Label>
								<Input {...props} bind:value={$dataForm.person.addressLine2} />
							{/snippet}
						</Form.Control>
					</Form.Field>
					<div class="grid grid-cols-2 gap-2">
						<Form.Field form={petitionForm} name="person.locality">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>{t`Locality`}</Form.Label>
									<Input
										{...props}
										bind:value={$dataForm.person.locality}
										data-testid="signup-address-locality"
									/>
								{/snippet}
							</Form.Control>
						</Form.Field>
						<Form.Field form={petitionForm} name="person.region">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>{t`Region`}</Form.Label>
									<Input
										{...props}
										bind:value={$dataForm.person.region}
										data-testid="signup-address-region"
									/>
								{/snippet}
							</Form.Control>
						</Form.Field>
						<Form.Field form={petitionForm} name="person.postcode">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>{t`Postcode`}</Form.Label>
									<Input
										{...props}
										bind:value={$dataForm.person.postcode}
										data-testid="signup-address-postcode"
									/>
								{/snippet}
							</Form.Control>
						</Form.Field>
						<Form.Field form={petitionForm} name="person.country">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>{t`Country`}</Form.Label>
									<CountrySelect {...props} bind:value={$dataForm.person.country as CountryCode} />
								{/snippet}
							</Form.Control>
						</Form.Field>
					</div>
				{/if}

				{#if personSurveyQuestions.includes('person.dateOfBirth')}
					<Form.Field form={petitionForm} name="person.dateOfBirth">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>{renderPersonQuestion('person.dateOfBirth')}</Form.Label>
								<DateOfBirth {...props} bind:value={$dataForm.person.dateOfBirth} />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				{/if}

				{#if personSurveyQuestions.includes('person.gender')}
					<Form.Field form={petitionForm} name="person.gender">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>{renderPersonQuestion('person.gender')}</Form.Label>
								<GenderSelect {...props} bind:value={$dataForm.person.gender as GenderOption} />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				{/if}

				{#if personSurveyQuestions.includes('person.workplace')}
					<Form.Field form={petitionForm} name="person.workplace">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>{renderPersonQuestion('person.workplace')}</Form.Label>
								<Input {...props} bind:value={$dataForm.person.workplace} />
							{/snippet}
						</Form.Control>
					</Form.Field>
				{/if}

				{#if personSurveyQuestions.includes('person.position')}
					<Form.Field form={petitionForm} name="person.position">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>{renderPersonQuestion('person.position')}</Form.Label>
								<Input {...props} bind:value={$dataForm.person.position} />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				{/if}

				{#each customSurveyQuestions as field}
					{#if field.type === 'custom.textInput'}
						<Form.Field form={petitionForm} name={`customFields.${field.id}`}>
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label
										>{field.label ||
											renderQuestionTypeName(field.type, page.data.locale)}</Form.Label
									>
									<Input
										type="text"
										{...props}
										required={field.required}
										bind:value={$dataForm.customFields[field.id]}
										data-testid={`signup-custom-field-${field.id}`}
									/>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
					{:else if field.type === 'custom.textarea'}
						<Form.Field form={petitionForm} name={`customFields.${field.id}`}>
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label
										>{field.label ||
											renderQuestionTypeName(field.type, page.data.locale)}</Form.Label
									>
									<Input
										type="textarea"
										{...props}
										required={field.required}
										bind:value={$dataForm.customFields[field.id]}
										data-testid={`signup-custom-field-${field.id}`}
									/>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
					{:else if field.type === 'custom.dateInput'}
						<Form.Field form={petitionForm} name={`customFields.${field.id}`}>
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label
										>{field.label ||
											renderQuestionTypeName(field.type, page.data.locale)}</Form.Label
									>
									<Input
										type="date"
										{...props}
										required={field.required}
										bind:value={$dataForm.customFields[field.id]}
										data-testid={`signup-custom-field-${field.id}`}
									/>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
					{:else if field.type === 'custom.emailInput'}
						<Form.Field form={petitionForm} name={`customFields.${field.id}`}>
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label
										>{field.label ||
											renderQuestionTypeName(field.type, page.data.locale)}</Form.Label
									>
									<Input
										type="email"
										{...props}
										required={field.required}
										bind:value={$dataForm.customFields[field.id]}
										data-testid={`signup-custom-field-${field.id}`}
									/>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
					{:else if field.type === 'custom.phoneInput'}
						<Form.Field form={petitionForm} name={`customFields.${field.id}`}>
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label
										>{field.label ||
											renderQuestionTypeName(field.type, page.data.locale)}</Form.Label
									>
									<div data-testid={`signup-custom-field-${field.id}`}>
										<PhoneNumberInput
											country={$dataForm.person.country}
											{...props}
											bind:value={$dataForm.customFields[field.id]}
										/>
									</div>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
					{:else if field.type === 'custom.numberInput'}
						<Form.Field form={petitionForm} name={`customFields.${field.id}`}>
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label
										>{field.label ||
											renderQuestionTypeName(field.type, page.data.locale)}</Form.Label
									>
									<Input
										type="number"
										{...props}
										required={field.required}
										bind:value={$dataForm.customFields[field.id]}
										data-testid={`signup-custom-field-${field.id}`}
									/>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
					{:else if field.type === 'custom.radioGroup'}
						<Form.Field form={petitionForm} name={`customFields.${field.id}`}>
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label
										>{field.label ||
											renderQuestionTypeName(field.type, page.data.locale)}</Form.Label
									>
									<RadioGroup.Root
										{...props}
										bind:value={$dataForm.customFields[field.id]}
										data-testid={`signup-custom-field-${field.id}`}
									>
										{#each field.options || [] as option}
											<div class="flex items-center space-x-2">
												<RadioGroup.Item value={option} id={`${field.id}-${option}`} />
												<label
													for={`${field.id}-${option}`}
													class="text-sm leading-none font-medium"
												>
													{option}
												</label>
											</div>
										{/each}
									</RadioGroup.Root>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
					{:else if field.type === 'custom.checkboxGroup'}
						<Form.Field form={petitionForm} name={`customFields.${field.id}`}>
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label
										>{field.label ||
											renderQuestionTypeName(field.type, page.data.locale)}</Form.Label
									>
									<div class="space-y-2" data-testid={`signup-custom-field-${field.id}`}>
										{#each field.options || [] as option}
											<div class="flex items-center space-x-2">
												<Checkbox
													{...props}
													id={`${field.id}-${option}`}
													checked={Array.isArray($dataForm.customFields[field.id]) &&
														$dataForm.customFields[field.id].includes(option)}
													onCheckedChange={(checked) => {
														const current = Array.isArray($dataForm.customFields[field.id])
															? $dataForm.customFields[field.id]
															: [];
														if (checked) {
															$dataForm.customFields[field.id] = [...current, option];
														} else {
															$dataForm.customFields[field.id] = current.filter(
																(value: string) => value !== option
															);
														}
													}}
												/>
												<label
													for={`${field.id}-${option}`}
													class="text-sm leading-none font-medium"
												>
													{option}
												</label>
											</div>
										{/each}
									</div>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
					{:else if field.type === 'custom.dropdown'}
						<Form.Field form={petitionForm} name={`customFields.${field.id}`}>
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label
										>{field.label ||
											renderQuestionTypeName(field.type, page.data.locale)}</Form.Label
									>
									<div data-testid={`signup-custom-field-${field.id}`}>
										<Select.Root
											type="single"
											{...props}
											bind:value={$dataForm.customFields[field.id]}
										>
											<Select.Trigger class="w-full">
												{$dataForm.customFields[field.id] || t`Select an option`}
											</Select.Trigger>
											<Select.Content>
												{#each field.options || [] as option}
													<Select.Item value={option}>{option}</Select.Item>
												{/each}
											</Select.Content>
										</Select.Root>
									</div>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
					{/if}
				{/each}

				<Button
					type="submit"
					class="w-full"
					size="lg"
					disabled={$submitting}
					data-testid="petition-signup-submit"
				>
					<PenLineIcon class="mr-2 size-5" />
					{#if $delayed}<Spinner class="mr-2 size-4" />{/if}
					{$submitting ? t`Signing...` : t`Sign this petition`}
				</Button>

				{#if whatsAppSignupLink}
					<div class="flex items-center gap-2 py-2">
						<div class="h-px flex-1 bg-gray-200"></div>
						<span class="text-xs text-muted-foreground">{t`or`}</span>
						<div class="h-px flex-1 bg-gray-200"></div>
					</div>
					<WhatsAppPetitionSignup {whatsAppSignupLink} />
				{/if}

				<p class="text-xs text-muted-foreground">
					{t`By signing, you agree to receive updates about this petition and related campaigns.`}
				</p>
			</form>
		{/if}
	</div>
</div>
