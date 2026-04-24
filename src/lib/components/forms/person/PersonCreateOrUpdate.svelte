<script lang="ts">
	import { t } from '$lib/index.svelte';
	import { beforeNavigate } from '$app/navigation';
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import CroppedImageUpload from '$lib/components/ui/image-upload/CroppedImageUpload.svelte';
	import * as Form from '$lib/components/ui/form/index.js';
	import CountrySelect from '$lib/components/ui/custom-select/country/country.svelte';
	import LanguageSelect from '$lib/components/ui/custom-select/language/language.svelte';
	import GenderSelect from '$lib/components/ui/custom-select/gender/gender.svelte';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import PhoneNumberInput from '$lib/components/ui/custom-select/phone-number/phone-number.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import createForm from '$lib/form.svelte';
	import {
		createPersonZero,
		updatePersonZero,
		type ReadPersonZero,
		createMutatorSchemaZero,
		type CreateMutatorSchemaZeroInput,
		updateMutatorSchemaZero,
		type UpdateMutatorSchemaZeroInput
	} from '$lib/schema/person';
	import { parse } from 'valibot';
	import { z } from '$lib/zero.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import { DEFAULT_SOCIAL_MEDIA } from '$lib/schema/person/meta';
	import type { CountryCode, LanguageCode } from '$lib/schema/helpers';
	import type { GenderOption } from '$lib/utils/person';
	import { v7 as uuidv7 } from 'uuid';
	import { toast } from 'svelte-sonner';
	const {
		person,
		onCreated
	}: { person?: ReadPersonZero; onCreated?: (personId: string) => void | Promise<void> } = $props();
	import { appState } from '$lib/state.svelte';
	import { defaultCountryCode } from '$lib/utils/country';

	const personTeamId = $derived.by(() => {
		if (appState.isAdminOrOwner) {
			return null; // admin or owner can create a person for any/no team
		} else {
			return appState.activeTeamId || appState.myTeams.data?.[0]?.id || null; // member can create a person for their active team or the first team they are a member of
		}
	});

	/* svelte-ignore state_referenced_locally */
	const { form, data, errors, Errors, helpers } = person
		? createForm({
				//update mode
				schema: updatePersonZero,
				/* svelte-ignore state_referenced_locally */
				initialData: person,
				onSubmit: async (data) => {
					const toUpdate: UpdateMutatorSchemaZeroInput = {
						input: {
							givenName: data.givenName,
							familyName: data.familyName,
							emailAddress: data.emailAddress,
							phoneNumber: data.phoneNumber,
							country: data.country,
							preferredLanguage: data.preferredLanguage
						},
						metadata: {
							organizationId: appState.organizationId,
							personId: person.id
						}
					};
					const parsed = parse(updateMutatorSchemaZero, toUpdate);
					const input = z.mutate(mutators.person.update(parsed));
					await input.client;
					form.tainted.set(undefined);
					onCreated?.(person.id);
				}
			})
		: createForm({
				//create mode
				schema: createPersonZero,
				validateOnLoad: false, // because we are adding some initial data
				initialData: {
					socialMedia: DEFAULT_SOCIAL_MEDIA,
					country: appState.activeOrganization?.data?.country || defaultCountryCode,
					preferredLanguage: appState.activeOrganization?.data?.defaultLanguage || 'en'
				},
				onSubmit: async (data) => {
					const personId = uuidv7();
					const toCreate: CreateMutatorSchemaZeroInput = {
						input: {
							...data
						},
						metadata: {
							organizationId: appState.organizationId,
							personId: personId,
							teamId: personTeamId || undefined,
							addedFrom: {
								type: 'added_manually',
								userId: appState.userId
							}
						}
					};
					const parsed = parse(createMutatorSchemaZero, toCreate);
					const input = z.mutate(mutators.person.create(parsed));
					await input.client;
					toast.success(t`Person created successfully`);
					form.tainted.set(undefined);
					await onCreated?.(personId);
				}
			});
	const country = $state(
		$data.country || appState.activeOrganization?.data?.country || defaultCountryCode
	);

	import { dateToInputValue, inputValueToDate } from '$lib/utils/date';

	function getDateOfBirth() {
		const returnedDate = $data.dateOfBirth ? dateToInputValue(new Date($data.dateOfBirth)) : null;
		return returnedDate;
	}
	function setDateOfBirth(dateString: string) {
		const date = inputValueToDate(dateString);
		console.log(date, 'date');
		if (date) {
			$data.dateOfBirth = date.getTime();
		}
	}
	import InputDate from '$lib/components/ui/custom-input/date.svelte';
	$effect(() => {
		const handler = (e: BeforeUnloadEvent) => {
			if (!helpers.isTainted()) return;
			e.preventDefault();
		};
		window.addEventListener('beforeunload', handler);
		return () => window.removeEventListener('beforeunload', handler);
	});

	beforeNavigate((nav) => {
		if (!helpers.isTainted()) return;
		if (!nav.to) return;
		if (!confirm(t`Your changes might not be saved. Leave this page?`)) {
			nav.cancel();
		}
	});
</script>

<form use:form.enhance id="person-form" data-testid="person-form">
	<div class="mx-auto flex w-full max-w-4xl flex-col gap-4">
		<Errors {errors} />
		<Card.Root>
			<Card.Content class="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<div class="col-span-2 mt-3 mb-8 flex w-full justify-center">
					<CroppedImageUpload
						aspectRatio={1 / 1}
						class="aspect-square h-60 w-60 rounded-full object-cover"
						onUpload={async (url) => {
							$data.profilePicture = url;
						}}
					/>
				</div>
				<Form.Field {form} name="givenName">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>{t`Given name`}</Form.Label>
							<Input {...props} data-testid="person-given-name" bind:value={$data.givenName} />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field {form} name="familyName">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>{t`Family name`}</Form.Label>
							<Input {...props} data-testid="person-family-name" bind:value={$data.familyName} />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>{t`Contact details`}</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
					<Form.Field {form} name="emailAddress">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>{t`Email address`}</Form.Label>
								<Input {...props} data-testid="person-email" bind:value={$data.emailAddress} />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
					<Form.Field {form} name="phoneNumber">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>{t`Phone number`}</Form.Label>
								<PhoneNumberInput {country} {...props} bind:value={$data.phoneNumber} />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
					<div class="col-span-2">
						<Form.Field {form} name="subscribed">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label
										class="flex items-start gap-3 rounded-lg border p-3 hover:bg-accent/50 has-[[aria-checked=true]]:border-blue-600 has-[[aria-checked=true]]:bg-blue-50 dark:has-[[aria-checked=true]]:border-blue-900 dark:has-[[aria-checked=true]]:bg-blue-950"
									>
										<Checkbox
											{...props}
											bind:checked={$data.subscribed}
											class="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700"
										/>
										<div class="grid gap-1.5 font-normal">
											<p class="text-sm leading-none font-medium">{t`Subscribed`}</p>
											<p class="text-sm text-muted-foreground">
												{t`If the person is subscribed, they will be able to receive notifications
													and messages.`}
											</p>
										</div>
									</Form.Label>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>{t`Address`}</Card.Title>
			</Card.Header>
			<Card.Content class="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<Form.Field {form} name="addressLine1">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>{t`Address line 1`}</Form.Label>
							<Input {...props} bind:value={$data.addressLine1} />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field {form} name="addressLine2">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>{t`Address line 2`}</Form.Label>
							<Input {...props} bind:value={$data.addressLine2} />
							<Form.FieldErrors />
						{/snippet}
					</Form.Control>
				</Form.Field>
				<Form.Field {form} name="locality">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>{t`City/town`}</Form.Label>
							<Input {...props} bind:value={$data.locality} />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field {form} name="region">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>{t`Region/state`}</Form.Label>
							<Input {...props} bind:value={$data.region} />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field {form} name="postcode">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>{t`Postcode`}</Form.Label>
							<Input {...props} bind:value={$data.postcode} />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field {form} name="country">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>{t`Country`}</Form.Label>
							<CountrySelect
								value={$data.country}
								onSelectChange={(v) => {
									$data.country = v as CountryCode;
								}}
								{...props}
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Header>
				<Card.Title>{t`Language`}</Card.Title>
			</Card.Header>
			<Card.Content>
				<Form.Field {form} name="preferredLanguage">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>{t`Preferred language`}</Form.Label>
							<LanguageSelect
								value={$data.preferredLanguage}
								onSelectChange={(v) => {
									$data.preferredLanguage = v as LanguageCode;
								}}
								{...props}
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Header>
				<Card.Title>{t`Personal details`}</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
					<Form.Field {form} name="dateOfBirth">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>{t`Date of birth`}</Form.Label>
								<InputDate {...props} bind:value={$data.dateOfBirth} />
							{/snippet}
						</Form.Control>
					</Form.Field>
					<Form.Field {form} name="gender">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>{t`Gender`}</Form.Label>
								<GenderSelect {...props} bind:value={$data.gender as GenderOption} />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
					<Form.Field {form} name="workplace">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>{t`Workplace`}</Form.Label>
								<Input {...props} bind:value={$data.workplace} />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
					<Form.Field {form} name="position">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>{t`Position`}</Form.Label>
								<Input {...props} bind:value={$data.position} />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				</div>
			</Card.Content>
		</Card.Root>
		{#if $data.socialMedia}
			<Card.Root>
				<Card.Header>
					<Card.Title>{t`Social media`}</Card.Title>
				</Card.Header>
				<Card.Content>
					<div class="grid grid-cols-1 gap-4">
						<Form.Field {form} name="socialMedia.facebook">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>{t`Facebook`}</Form.Label>
									<Input {...props} bind:value={$data.socialMedia!.facebook} />
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
						<Form.Field {form} name="socialMedia.twitter">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>{t`Twitter`}</Form.Label>
									<Input {...props} bind:value={$data.socialMedia!.twitter} />
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
						<Form.Field {form} name="socialMedia.instagram">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>{t`Instagram`}</Form.Label>
									<Input {...props} bind:value={$data.socialMedia!.instagram} />
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
						<Form.Field {form} name="socialMedia.linkedIn">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>{t`LinkedIn`}</Form.Label>
									<Input {...props} bind:value={$data.socialMedia!.linkedIn} />
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
						<Form.Field {form} name="socialMedia.tiktok">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>{t`TikTok`}</Form.Label>
									<Input {...props} bind:value={$data.socialMedia!.tiktok} />
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
						<Form.Field {form} name="socialMedia.website">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>{t`Website`}</Form.Label>
									<Input {...props} bind:value={$data.socialMedia!.website} />
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
					</div>
				</Card.Content>
			</Card.Root>
		{/if}
	</div>
</form>
