<script lang="ts">
	import { t } from '$lib/index.svelte';
	import AuthLayout from '$lib/components/widgets/AuthLayout.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Form from '$lib/components/ui/form/index.js';

	import * as Card from '$lib/components/ui/card/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';

	import { Input } from '$lib/components/ui/input/index.js';
	import ErrorAlert from '$lib/components/alerts/Error.svelte';
	import { cn } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';
	import { goto } from '$app/navigation';
	let { class: className, ...restProps }: HTMLAttributes<HTMLDivElement> = $props();
	const id = $props.id();

	import { authClient } from '$lib/auth-client';
	async function handleGoogleSignup() {
		await authClient.signIn.social({
			provider: 'google',
			callbackURL: '/',
			errorCallbackURL: '/signup?error=true',
			newUserCallbackURL: '/welcome'
		});
	}

	let loading: boolean = $state(false);
	let error: string | null = $state(null);
	let sentVerificationEmailTo: string | null = $state(null);
	let success: boolean = $state(false);

	import createForm from '$lib/form.svelte';
	import { signupSchema } from './schema';
	const { form, data, Errors, Debug, errors } = createForm({
		schema: signupSchema,
		onSubmit: async (formData) => {
			await authClient.signUp.email(
				{
					email: formData.email,
					password: formData.password,
					name: formData.name
				},
				{
					onRequest: (ctx) => {
						loading = true;
					},
					onSuccess: async (ctx) => {
						const userEmail = ctx.data.user.email;
						sentVerificationEmailTo = userEmail;
						loading = false;
						success = true;
					},
					onError: (ctx) => {
						// display the error message
						console.log(ctx);
						error = ctx.error.message;
						loading = false;
					}
				}
			);
		}
	});
</script>

<AuthLayout
	link="/"
	title={t`Welcome to Belcoda`}
	description={t`Create an account to get started`}
	{footer}
>
	{#if success}
		{@render successMessage()}
	{:else}
		<form use:form.enhance class="space-y-6">
			{#if loading}
				<div class="flex justify-center">
					<Spinner />
				</div>
			{:else}
				{@render googleSignup()}
				{@render orCreateAccountUsingEmailAndPassword()}
				<Errors {errors} />
				{#if error}
					<ErrorAlert>{error}</ErrorAlert>
				{/if}
				<Form.Field {form} name="name">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>{t`Name`}</Form.Label>
							<Input
								{...props}
								type="text"
								autocomplete="name"
								placeholder={t`Your full name`}
								bind:value={$data.name}
							/>
							<Form.FieldErrors />
						{/snippet}
					</Form.Control>
				</Form.Field>
				<Form.Field {form} name="email">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>{t`Email`}</Form.Label>
							<Input
								{...props}
								type="email"
								autocomplete="email"
								placeholder={t`email@example.com`}
								bind:value={$data.email}
							/>
							<Form.FieldErrors />
						{/snippet}
					</Form.Control>
				</Form.Field>
				<Form.Field {form} name="password">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>{t`Password`}</Form.Label>
							<Input
								{...props}
								type="password"
								autocomplete="new-password"
								placeholder="••••••••••••"
								bind:value={$data.password}
							/>
							<Form.FieldErrors />
						{/snippet}
					</Form.Control>
				</Form.Field>
				<Form.Field {form} name="confirmPassword">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>{t`Confirm Password`}</Form.Label>
							<Input
								{...props}
								type="password"
								autocomplete="new-password"
								placeholder="••••••••••••"
								bind:value={$data.confirmPassword}
							/>
							<Form.FieldErrors />
						{/snippet}
					</Form.Control>
				</Form.Field>
				<Button type="submit" class="w-full" disabled={loading}>
					{loading ? t`Creating account...` : t`Create account`}
				</Button>
				<Debug {data} />
				<div class="text-center text-sm">
					{t`Already have an account?`}
					<a href="/login" class="underline underline-offset-4"> {t`Sign in`} </a>
				</div>
			{/if}
		</form>
	{/if}
</AuthLayout>

{#snippet footer()}
	<div
		class="mt-6 text-center text-xs text-balance text-muted-foreground *:[a]:underline *:[a]:underline-offset-4 *:[a]:hover:text-primary"
	>
		{@html t`By clicking continue, you agree to our <a href="https://www.belcoda.com/terms-of-service">Terms of Service</a>
		and <a href="https://www.belcoda.com/privacy">Privacy Policy</a>.`}
	</div>
{/snippet}

{#snippet googleSignup()}
	<div class="flex flex-col gap-4">
		<Button
			type="button"
			variant="outline"
			class="w-full"
			onclick={handleGoogleSignup}
			disabled={loading}
		>
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="mr-2 size-4">
				<path
					d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
					fill="currentColor"
				/>
			</svg>
			{t`Sign up with Google`}
		</Button>
	</div>
{/snippet}

{#snippet orCreateAccountUsingEmailAndPassword()}<div
		class="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border"
	>
		<span class="relative z-10 bg-card px-2 text-muted-foreground">
			{t`Or create an account using email and password`}
		</span>
	</div>
{/snippet}

{#snippet successMessage()}
	<div class="flex flex-col gap-4 text-center">
		<div class="rounded border border-green-800 bg-green-50 p-4 text-sm text-green-800">
			<h3 class="mb-2 font-semibold">{t`Check your email`}</h3>
			<p>
				{t`We've sent a verification link to`} <strong>{sentVerificationEmailTo}</strong>. {t`Please click the link in the email to verify your account before signing in.`}
			</p>
		</div>
		<Button variant="outline" onclick={() => goto('/login')}>{t`Go to Login`}</Button>
	</div>
{/snippet}
