<script lang="ts">
	import AuthLayout from '$lib/components/widgets/AuthLayout.svelte';
	import ErrorAlert from '$lib/components/alerts/Error.svelte';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import createForm from '$lib/form.svelte';
	import { goto } from '$app/navigation';
	let loading = $state(false);
	let error: string | undefined = $state(undefined);
	import { createOrganization } from './actions';
	import { newOrganizationSchema } from './schema';
	const { form, data, Errors, Debug, errors } = createForm({
		schema: newOrganizationSchema,
		onSubmit: async (formData) => {
			try {
				loading = true;
				const organization = await createOrganization(formData.name, formData.slug);
				await goto(`/`);
			} catch (err) {
				console.error(`Error creating organization: ${err}`);
				error = err instanceof Error ? err.message : 'An unknown error occurred';
			} finally {
				loading = false;
			}
		}
	});
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
</script>

<AuthLayout
	link="/organization"
	title="Create a new organization"
	description="Create a new organization to get started"
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
			<Form.Field {form} name="name">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Name</Form.Label>
						<Input {...props} bind:value={$data.name} autocomplete="organization" />
						<Form.Description
							>The name of your organization. You <strong>cannot</strong> change it later.</Form.Description
						>
						<Form.FieldErrors />
					{/snippet}
				</Form.Control>
			</Form.Field>
			<Form.Field {form} name="slug">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Slug</Form.Label>
						<Input {...props} bind:value={$data.slug} autocomplete="off" />
						<Form.FieldErrors />
					{/snippet}
				</Form.Control>
			</Form.Field>
			<div class="flex justify-between gap-2">
				<Button type="button" href="/organization" variant="outline" class="w-auto">Back</Button>
				<Button type="submit" class="w-auto">Create Organization</Button>
			</div>
			<Debug {data} />
		</form>
	{/if}
</AuthLayout>
