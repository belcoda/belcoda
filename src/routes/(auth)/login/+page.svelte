<script lang="ts">
	import { t } from '$lib/index.svelte';
	import AuthLayout from '$lib/components/widgets/AuthLayout.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import ErrorAlert from '$lib/components/alerts/Error.svelte';
	import { goto } from '$app/navigation';

	import { authClient } from '$lib/auth-client';
	async function handleGoogleLogin() {
		await authClient.signIn.social({
			provider: 'google',
			callbackURL: '/',
			errorCallbackURL: '/login?error=true',
			newUserCallbackURL: '/'
		});
	}

	let loading: boolean = $state(false);
	let error: string | null = $state(null);

	import createForm from '$lib/form.svelte';
	import { loginSchema } from './schema';
	const { form, data, Errors, errors, Debug } = createForm({
		schema: loginSchema,
		onSubmit: async (formData) => {
			await authClient.signIn.email(
				{
					email: formData.email,
					password: formData.password
				},
				{
					onRequest: (ctx) => {
						loading = true;
					},
					onSuccess: async (ctx) => {
						loading = false;
						await goto('/');
					},
					onError: (ctx) => {
						// display the error message
						error = ctx.error.message;
						loading = false;
					}
				}
			);
		}
	});
</script>

<AuthLayout link="/" title={t`Welcome back`} description={t`Login with your Google account`}>
	<form use:form.enhance class="space-y-6">
		{#if loading}
			<div class="flex justify-center">
				<Spinner />
			</div>
		{:else}
			{@render googleLogin()}
			{@render orContinueWith()}

			<Errors {errors} />
			{#if error}
				<ErrorAlert>{error}</ErrorAlert>
			{/if}
			<Form.Field {form} name="email">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>{t`Email`}</Form.Label>
						<Input
							{...props}
							type="email"
							placeholder={t`email@example.com`}
							autocomplete="email"
							bind:value={$data.email}
						/>
						<Form.FieldErrors />
					{/snippet}
				</Form.Control>
			</Form.Field>
			<Form.Field {form} name="password">
				<Form.Control>
					{#snippet children({ props })}
						<div class="flex items-center">
							<Form.Label>{t`Password`}</Form.Label>
							<a
								href="/login/forgot_password"
								class="ml-auto text-sm underline-offset-4 hover:underline"
							>
								{t`Forgot your password?`}
							</a>
						</div>
						<Input
							{...props}
							type="password"
							placeholder="••••••••••••"
							autocomplete="current-password"
							bind:value={$data.password}
						/>
						<Form.FieldErrors />
					{/snippet}
				</Form.Control>
			</Form.Field>
			<Button type="submit" class="w-full" disabled={loading}>
				{loading ? t`Logging in...` : t`Login`}
			</Button>
			<Debug {data} />
			<div class="text-center text-sm">
				{t`Don't have an account?`}
				<a href="/signup" class="underline underline-offset-4"> {t`Sign up`} </a>
			</div>
		{/if}
	</form>
</AuthLayout>

{#snippet googleLogin()}
	<div class="flex flex-col gap-4">
		<Button
			type="button"
			variant="outline"
			class="w-full"
			onclick={handleGoogleLogin}
			disabled={loading}
		>
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="mr-2 size-4">
				<path
					d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
					fill="currentColor"
				/>
			</svg>
			{t`Login with Google`}
		</Button>
	</div>
{/snippet}

{#snippet orContinueWith()}
	<div
		class="relative my-4 text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border"
	>
		<span class="relative z-10 bg-card px-2 text-muted-foreground"> {t`Or continue with`} </span>
	</div>
{/snippet}
