<script lang="ts">
	import { t } from '$lib/index.svelte';
	import AuthLayout from '$lib/components/widgets/AuthLayout.svelte';
	import { authClient } from '$lib/auth-client';
	import { confirmPasswordSchema } from '$lib/schema/helpers';
	import { cn } from '$lib/utils';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import ErrorAlert from '$lib/components/alerts/Error.svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	let { class: className, ...restProps }: HTMLAttributes<HTMLDivElement> = $props();

	import createForm from '$lib/form.svelte';
	const { form, Errors, data, errors, Debug } = createForm({
		schema: confirmPasswordSchema,
		onSubmit: resetPassword
	});

	let loading = $state(false);
	let errorAlert: string | null = $state(null);
	let successAlert: string | null = $state(null);
	const token = $derived(page.url.searchParams.get('token'));

	async function resetPassword() {
		if (!token) {
			errorAlert = t`Reset token is missing. Please use the link from your email.`;
			return;
		}
		if ($data.password1 !== $data.password2) {
			console.error('Passwords do not match'); //this shouldn't happen, due to form validation
			return;
		}
		try {
			loading = true;
			const { data: returnedData, error } = await authClient.resetPassword({
				newPassword: $data.password1,
				token
			});
			if (error) {
				errorAlert = error.message || null;
			} else {
				successAlert = t`Password reset successfully`;
			}
		} catch (err) {
			errorAlert = err instanceof Error ? err.message : t`An unknown error occurred`;
		} finally {
			loading = false;
		}
	}
</script>

<AuthLayout link="/" title={t`Reset your password`} description={t`Enter your new password below`}>
	<Card.Root>
		<Card.Header class="text-center">
			<Card.Title class="text-xl">{t`Reset your password`}</Card.Title>
			<Card.Description>{t`Enter your new password below`}</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if page.url.searchParams.get('error') === 'INVALID_TOKEN'}
				{@render invalidToken()}
			{:else}
				{#if errorAlert}
					<ErrorAlert>{errorAlert}</ErrorAlert>
				{/if}
				{#if successAlert}
					{@render passwordResetSuccess()}
				{:else}
					{@render resetPasswordForm()}
				{/if}
			{/if}
		</Card.Content>
	</Card.Root>
</AuthLayout>

{#snippet resetPasswordForm()}
	{#if loading}
		<Spinner />
	{:else}
		<form use:form.enhance novalidate class="space-y-6">
			<Errors {errors} />
			<Form.Field {form} name="password1">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>{t`New Password`}</Form.Label>
						<Input
							{...props}
							type="password"
							placeholder="••••••••••••"
							autocomplete="new-password"
							bind:value={$data.password1}
						/>
						<Form.FieldErrors />
					{/snippet}
				</Form.Control>
			</Form.Field>
			<Form.Field {form} name="password2">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>{t`Confirm Password`}</Form.Label>
						<Input
							{...props}
							type="password"
							placeholder="••••••••••••"
							autocomplete="new-password"
							bind:value={$data.password2}
						/>
						<Form.FieldErrors />
					{/snippet}
				</Form.Control>
			</Form.Field>

			<div>
				<Button type="submit" class="w-full" disabled={loading}>
					{loading ? t`Resetting password...` : t`Reset password`}
				</Button>
			</div>

			<Debug {data} />
		</form>
<div class="text-center text-sm">
		{t`Remember your password?`}
		<a href="/login" class="underline underline-offset-4"> {t`Login`} </a>
	</div>
	{/if}
{/snippet}

{#snippet passwordResetSuccess()}
	<div class="flex flex-col gap-4 text-center">
		<div class="rounded border border-green-800 bg-green-50 p-4 text-sm text-green-800">
			<h3 class="mb-2 font-semibold">{t`Password reset successfully`}</h3>
			<p>{t`Your password has been reset. You can now sign in with your new password.`}</p>
		</div>
		<Button variant="outline" onclick={() => goto('/login')}>{t`Go to Login`}</Button>
	</div>
{/snippet}

{#snippet invalidToken()}
	<div class="flex flex-col gap-4 text-center">
		<div class="rounded border border-red-800 bg-red-50 p-4 text-sm text-red-800">
			<h3 class="mb-2 font-semibold">{t`Invalid or expired token`}</h3>
			<p>
				{t`The password reset link is invalid or has expired. Please request a new password reset link.`}
			</p>
		</div>
		<Button variant="outline" onclick={() => goto('/login/forgot_password')}>
			{t`Request new reset link`}
		</Button>
	</div>
{/snippet}
