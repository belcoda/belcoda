<script lang="ts">
	import { t } from '$lib/index.svelte';
	import AuthLayout from '$lib/components/widgets/AuthLayout.svelte';
	import ErrorAlert from '$lib/components/alerts/Error.svelte';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import createForm from '$lib/form.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	let loading = $state(false);
	let error: string | undefined = $state(undefined);
	import { createOrganization } from './actions';
	import { newOrganizationFromWebsiteForm as createOrganizationSchema } from '$lib/schema/organization';

	const { form, data, Errors, Debug, errors } = createForm({
		schema: createOrganizationSchema,
		onSubmit: async (formData) => {
			try {
				loading = true;
				const created = await createOrganization(formData);
				await goto(resolve(`/setup?org=${encodeURIComponent(created.id)}`));
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
</script>

<AuthLayout
	link="/organization"
	title={t`Create a new organization`}
	description={t`Start with your organization’s name. You can add more details later.`}
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
						<Form.Label>{t`Organization name`}</Form.Label>
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
										<ResponsiveModal title={t`Edit public web address`} bind:open={editSlugOpen}>
											{#snippet trigger()}
												<InputGroup.Button type="button">{t`Edit`}</InputGroup.Button>
											{/snippet}

											<Form.Field {form} name="slug">
												<Form.Control>
													{#snippet children({ props })}
														<Form.Label>{t`Public web address`}</Form.Label>
														<Input
															bind:value={$data.slug}
															{...props}
															class="font-mono"
															placeholder={t`your-organization`}
														/>
													{/snippet}
												</Form.Control>
												<Form.Description>
													{t`This address is used for your public event and petition pages. Use lowercase letters, numbers, and hyphens. Each organization needs a unique address.`}
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

			<details class="rounded-lg border p-4">
				<summary class="cursor-pointer text-sm font-medium"
					>{t`Add website or logo (optional)`}</summary
				>
				<div class="mt-4 flex flex-col gap-4">
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
							{#snippet children()}
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
				</div>
			</details>

			<Button type="submit" class="w-full">{t`Create organization`}</Button>
			<Debug {data} />
		</form>
	{/if}
	{#snippet footer()}
		<div class="flex justify-center">
			<Button type="button" href="/organization" variant="ghost" class="w-auto">{t`Back`}</Button>
		</div>{/snippet}
</AuthLayout>
