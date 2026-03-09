<script lang="ts">
	import { t } from '$lib/index.svelte';
	import AuthLayout from '$lib/components/widgets/AuthLayout.svelte';
	import ErrorAlert from '$lib/components/alerts/Error.svelte';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import createForm from '$lib/form.svelte';
	import { goto } from '$app/navigation';
	let loading = $state(false);
	let error: string | undefined = $state(undefined);
	import { createOrganization } from './actions';
	import { newOrganizationFromWebsiteForm as createOrganizationSchema } from '$lib/schema/organization';
	const { form, data, Errors, Debug, errors } = createForm({
		schema: createOrganizationSchema,
		onSubmit: async (formData) => {
			try {
				loading = true;
				await createOrganization(formData);
				await goto(`/organization/new/onboarding`);
			} catch (err) {
				console.error(`Error creating organization: ${err}`);
				error = err instanceof Error ? err.message : t`An unknown error occurred`;
			} finally {
				loading = false;
			}
		}
	});
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import { slugify } from '$lib/utils/slug';
	import { useDebounce } from 'runed';
	let editSlugOpen = $state(false);
	import LinkIcon from '@lucide/svelte/icons/link';
	import ResponsiveModal from '$lib/components/ui/responsive-modal/responsive-modal.svelte';
	import { dev } from '$app/environment';
	import { env } from '$env/dynamic/public';
	import CroppedImageUpload from '$lib/components/ui/image-upload/CroppedImageUpload.svelte';
	import * as Select from '$lib/components/ui/select/index.js';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
</script>

<AuthLayout
	link="/organization"
	title={t`Create a new organization`}
	description={t`Create a new organization to get started`}
>
	{#if loading}
		<div class="my-12 flex justify-center">
			<Spinner />
		</div>
	{:else}
		<form use:form.enhance class="flex w-full max-w-md flex-col gap-4">
			<Errors {errors} />
			{#if error}
				<ErrorAlert>{error}</ErrorAlert>
			{/if}
			<Form.Field {form} name="name" class="w-full">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>{t`Title`}</Form.Label>
						<InputGroup.Root>
							<InputGroup.Input
								bind:value={$data.name}
								{...props}
								placeholder={t`Organization name`}
								oninput={useDebounce(
									() => {
										if (!form.isTainted('slug')) {
											data.update(
												($store) => {
													const slug = slugify($data.name ?? '');
													return { ...$store, slug };
												},
												{ taint: false }
											);
										}
									},
									() => 300
								)}
							/>
							{#if $data.name && $data.name.length > 0}
								<InputGroup.Addon align="block-end" class="flex items-center justify-end gap-2">
									<InputGroup.Text>
										<LinkIcon class="size-4" /><span class="font-mono text-xs"
											>http{dev ? '' : 's'}://{$data.slug}.{env.PUBLIC_ROOT_DOMAIN}</span
										>
										<ResponsiveModal title={t`Edit organization slug`} bind:open={editSlugOpen}>
											{#snippet trigger()}
												<InputGroup.Button type="button">Edit</InputGroup.Button>
											{/snippet}

											<Form.Field {form} name="slug">
												<Form.Control>
													{#snippet children({ props })}
														<Input
															bind:value={$data.slug}
															{...props}
															class="font-mono"
															placeholder={t`Slug`}
														/>
													{/snippet}
												</Form.Control>
												<Form.Description>
													{t`This is a URL-friendly identifier for the organization that can be used in links for events, petitions and other pages.
													It must be unique and can only contain lowercase letters, numbers, and
													hyphens.`}
												</Form.Description>
												<Form.FieldErrors />
											</Form.Field>
											{#snippet footer()}
												<Button
													variant="default"
													size="sm"
													class="w-full"
													type="button"
													onclick={() => {
														form.validate('slug');
														editSlugOpen = false;
													}}>{t`Save`}</Button
												>
											{/snippet}
										</ResponsiveModal>
									</InputGroup.Text>
								</InputGroup.Addon>
							{/if}
						</InputGroup.Root>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="website" class="w-full">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>{t`Website (optional)`}</Form.Label>
						<Input {...props} name="website" bind:value={$data.website} />
					{/snippet}
				</Form.Control>
			</Form.Field>

			<Form.Field {form} name="icon" class="w-full">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>{t`Organization logo (optional)`}</Form.Label>
						<Form.Description
							>{t`Your organization's logo. It should be square and less than 2MB`}</Form.Description
						>
						<CroppedImageUpload
							class="aspect-square"
							aspectRatio={1 / 1}
							onUpload={(url) => {
								$data.icon = url;
							}}
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Separator />
			<h3 class="text-xl font-semibold">{t`Additional details`}</h3>
			<p class="text-sm text-muted-foreground">
				{t`Please provide some additional details about your organization to help us better understand your needs.`}
			</p>

			{@render orgFocus()}
			{@render orgSize()}
			{@render howDidYouDiscover()}

			<Separator />

			{@render whatPlans()}
			<Button type="submit" class="w-auto">{t`Create Organization`}</Button>
			<Debug {data} />
		</form>
	{/if}
	{#snippet footer()}
		<div class="flex justify-center">
			<Button type="button" href="/organization" variant="ghost" class="w-auto">{t`Back`}</Button>
		</div>{/snippet}
</AuthLayout>

{#snippet orgFocus()}
	{@const options = [
		{
			value: 'community-org-charity',
			label: t`Community organization or charity`
		},
		{ value: 'business', label: t`Business or corporation` },
		{ value: 'advocacy', label: t`Advocacy or policy campaign` },
		{ value: 'political', label: t`Political party & election campaign` }
	]}
	<Form.Field {form} name="additionalDetails.organizationFocus" class="w-full">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>{t`What is your organization's focus?`}</Form.Label>
				<Select.Root
					type="single"
					bind:value={$data.additionalDetails.organizationFocus}
					{...props}
				>
					<Select.Trigger class="w-full">
						{options.find((option) => option.value === $data.additionalDetails.organizationFocus)
							?.label ?? t`Select an option`}
					</Select.Trigger>
					<Select.Content>
						{#each options as option}
							<Select.Item value={option.value} label={option.label} />
						{/each}
					</Select.Content>
				</Select.Root>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
{/snippet}

{#snippet orgSize()}
	{@const options = [
		{
			value: '1',
			label: t`1-10 employees`
		},
		{ value: '2-10', label: t`11-50 employees` },
		{ value: '11-50', label: t`50-500 employees` },
		{ value: '500+', label: t`500+ employees` }
	]}
	<Form.Field {form} name="additionalDetails.organizationSize" class="w-full">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>{t`How many people are in your organization?`}</Form.Label>

				<Select.Root type="single" bind:value={$data.additionalDetails.organizationSize} {...props}>
					<Select.Trigger class="w-full">
						{options.find((option) => option.value === $data.additionalDetails.organizationSize)
							?.label ?? t`Select an option`}
					</Select.Trigger>
					<Select.Content>
						{#each options as option}
							<Select.Item value={option.value} label={option.label} />
						{/each}
					</Select.Content>
				</Select.Root>
				<Form.Description>
					{t`Only include staff or core volunteers who are actively involved in the organization's main operations.`}
				</Form.Description>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
{/snippet}

{#snippet howDidYouDiscover()}
	{@const options = [
		{
			value: 'search-engine',
			label: t`Search engine`
		},
		{ value: 'referral', label: t`Referral` },
		{ value: 'training-conference', label: t`Training or conference` },
		{ value: 'resources', label: t`Resources` },
		{ value: 'social-media', label: t`Social media` }
	]}
	<Form.Field {form} name="additionalDetails.howDidYouDiscover" class="w-full">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>{t`How did you discover Belcoda?`}</Form.Label>

				<Select.Root
					type="single"
					bind:value={$data.additionalDetails.howDidYouDiscover}
					{...props}
				>
					<Select.Trigger class="w-full">
						{options.find((option) => option.value === $data.additionalDetails.howDidYouDiscover)
							?.label ?? t`Select an option`}
					</Select.Trigger>
					<Select.Content>
						{#each options as option}
							<Select.Item value={option.value} label={option.label} />
						{/each}
					</Select.Content>
				</Select.Root>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
{/snippet}

{#snippet whatPlans()}
	<div class="flex flex-col gap-2">
		<div class="text-xl font-semibold">{t`What will you use Belcoda for?`}</div>
		<div class="text-sm text-muted-foreground">{t`Select all that apply`}</div>
		<div class="mt-2 flex flex-col gap-4">
			<div class="flex items-center gap-2">
				<Checkbox
					id="storingMemberOrSupporterData"
					bind:checked={$data.additionalDetails.features.storingMemberOrSupporterData}
				/>
				<Label for="storingMemberOrSupporterData">{t`Storing member or supporter data`}</Label>
			</div>
			<div class="flex items-center gap-2">
				<Checkbox
					id="growingOurListOfSupportersOrMembers"
					bind:checked={$data.additionalDetails.features.growingOurListOfSupportersOrMembers}
				/>
				<Label for="growingOurListOfSupportersOrMembers"
					>{t`Growing your list of supporters or members`}</Label
				>
			</div>
			<div class="flex items-center gap-2">
				<Checkbox
					id="sendingWhatsAppMessagesToMembersOrSupporters"
					bind:checked={
						$data.additionalDetails.features.sendingWhatsAppMessagesToMembersOrSupporters
					}
				/>
				<Label for="sendingWhatsAppMessagesToMembersOrSupporters"
					>{t`Sending WhatsApp messages to members or supporters`}</Label
				>
			</div>
			<div class="flex items-center gap-2">
				<Checkbox
					id="sendingEmailsToMembersOrSupporters"
					bind:checked={$data.additionalDetails.features.sendingEmailsToMembersOrSupporters}
				/>
				<Label for="sendingEmailsToMembersOrSupporters"
					>{t`Sending emails to members or supporters`}</Label
				>
			</div>
			<div class="flex items-center gap-2">
				<Checkbox
					id="runningEvents"
					bind:checked={$data.additionalDetails.features.runningEvents}
				/>
				<Label for="runningEvents">{t`Running events`}</Label>
			</div>
			<div class="flex items-center gap-2">
				<Checkbox
					id="runningPolicyCampaignsWithOnlinePetitions"
					bind:checked={$data.additionalDetails.features.runningPolicyCampaignsWithOnlinePetitions}
				/>
				<Label for="runningPolicyCampaignsWithOnlinePetitions"
					>{t`Running policy campaigns with online petitions`}</Label
				>
			</div>
			<div class="flex items-center gap-2">
				<Checkbox
					id="makingSureAllDataIsSyncedAndUpToDate"
					bind:checked={$data.additionalDetails.features.makingSureAllDataIsSyncedAndUpToDate}
				/>
				<Label for="makingSureAllDataIsSyncedAndUpToDate"
					>{t`Making sure all data is synced and up to date`}</Label
				>
			</div>
			<div class="flex items-center gap-2">
				<Checkbox id="featuresOther" bind:checked={$data.additionalDetails.features.other} />
				<Label for="featuresOther">{t`Other`}</Label>
			</div>
			{#if $data.additionalDetails.features.other}
				<div>
					<Label for="other">{t`Other (detail)`}</Label>
					<Input
						type="text"
						class="mt-2"
						bind:value={$data.additionalDetails.features.otherDetail}
					/>
				</div>
			{/if}
		</div>
	</div>
{/snippet}
