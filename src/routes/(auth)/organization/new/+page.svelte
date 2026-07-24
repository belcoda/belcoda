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

	function trackOrganizationCreationConversion() {
		if (typeof window.gtag !== 'function') return;

		window.gtag('event', 'conversion', {
			send_to: 'AW-17963790839/zEgdCIevp_sbEPfj5vVC',
			value: 1.0,
			currency: 'JPY'
		});
	}

	const { form, data, Errors, Debug, errors } = createForm({
		schema: createOrganizationSchema,
		onSubmit: async (formData) => {
			try {
				loading = true;
				await createOrganization(formData);
				trackOrganizationCreationConversion();
				await goto('/');
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
	import { Textarea } from '$lib/components/ui/textarea/index.js';
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

			{@render howDidYouDiscover()}

			<Button type="submit" class="w-auto">{t`Create Organization`}</Button>
			<Debug {data} />
		</form>
	{/if}
	{#snippet footer()}
		<div class="flex justify-center">
			<Button type="button" href="/organization" variant="ghost" class="w-auto">{t`Back`}</Button>
		</div>{/snippet}
</AuthLayout>

{#snippet howDidYouDiscover()}
	{@const options = [
		{
			value: 'search-engine',
			label: t`Search engine`
		},
		{ value: 'social-media', label: t`Social media` },
		{ value: 'friend-or-colleague', label: t`Friend or colleague` },
		{ value: 'event-or-webinar', label: t`Event or webinar` },
		{ value: 'partner', label: t`Partner organization` },
		{ value: 'community-group', label: t`Community group` },
		{ value: 'belcoda-resources', label: t`Belcoda resources` },
		{ value: 'other', label: t`Other` }
	]}
	<Form.Field {form} name="additionalDetails.howDidYouDiscover" class="w-full">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>{t`How did you hear about Belcoda?`}</Form.Label>

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
	{#if $data.additionalDetails.howDidYouDiscover === 'other'}
		<Form.Field {form} name="additionalDetails.howDidYouDiscoverDetail" class="w-full">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>{t`Tell us where you heard about Belcoda`}</Form.Label>
					<Textarea
						{...props}
						maxlength={500}
						bind:value={$data.additionalDetails.howDidYouDiscoverDetail}
					/>
					<Form.Description>{t`Maximum 500 characters.`}</Form.Description>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
	{/if}
{/snippet}
