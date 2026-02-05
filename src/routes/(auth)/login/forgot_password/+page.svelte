<script lang="ts">
	import { t } from '$lib/index.svelte';
	import AuthLayout from '$lib/components/widgets/AuthLayout.svelte';
	import { authClient } from '$lib/auth-client';
	import { email } from '$lib/schema/helpers';
	import { object } from 'valibot';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import ErrorAlert from '$lib/components/alerts/Error.svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	let { class: className, ...restProps }: HTMLAttributes<HTMLDivElement> = $props();

	const schema = object({
		email: email
	});

	import createForm from '$lib/form.svelte';
	const { form, Errors, data, errors, Debug } = createForm({
		schema,
		onSubmit: requestPasswordReset
	});

	let loading = $state(false);
	let errorAlert: string | null = $state(null);
	let successAlert: string | null = $state(null);
	let sentResetEmailTo: string | null = $state(null);

	async function requestPasswordReset() {
		try {
			loading = true;
			const { data: returnedData, error } = await authClient.requestPasswordReset({
				email: $data.email,
				redirectTo: '/login/forgot_password/reset_password'
			});
			if (error) {
				errorAlert = error.message || null;
			} else {
				sentResetEmailTo = $data.email;
				successAlert = 'Notification sent';
			}
		} catch (err) {
			errorAlert = err instanceof Error ? err.message : 'An unknown error occurred';
		} finally {
			loading = false;
		}
	}
</script>

<AuthLayout
	link="/"
	title={t`Forgot your password?`}
	description={t`Enter your email to reset your password`}
>
	{#if errorAlert}
		<ErrorAlert>{errorAlert}</ErrorAlert>
	{/if}
	{#if successAlert}
		{@render successMessage()}
	{:else}
		{@render forgotPasswordForm()}
	{/if}
</AuthLayout>

{#snippet forgotPasswordForm()}
	{#if loading}
		<Spinner />
	{:else}
		<form use:form.enhance novalidate class="space-y-6">
			<Errors {errors} />
			<Form.Field {form} name="email">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>{t`Email`}</Form.Label>
						<Input
							{...props}
							type="email"
							placeholder={t`email@example.com`}
							bind:value={$data.email}
						/>
					{/snippet}
				</Form.Control>
			</Form.Field>

			<div>
				<Button type="submit" class="btn-blue w-full" disabled={loading}>{t`Reset password`}</Button
				>
			</div>

			<Debug {data} />
		</form>
		<div class="text-center text-sm">
			{t`Remember your password?`}
			<a href="/login" class="underline underline-offset-4"> {t`Login`} </a>
		</div>
	{/if}
{/snippet}

{#snippet successMessage()}
	<div class="flex flex-col gap-4 text-center">
		<div class="rounded border border-green-800 bg-green-50 p-4 text-sm text-green-800">
			<h3 class="mb-2 font-semibold">{t`Password reset email sent`}</h3>
			<p>
				{t`We've sent a password reset email to the email address you provided. Please check your email and follow the instructions to reset your password.`}
			</p>
		</div>
	</div>
{/snippet}
