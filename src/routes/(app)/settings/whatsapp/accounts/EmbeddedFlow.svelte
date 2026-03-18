<script lang="ts">
	import { t } from '$lib/index.svelte';
	import { env } from '$env/dynamic/public';
	import { onMount } from 'svelte';
	import { Alert } from '$lib/components/ui/alert/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { z } from '$lib/zero.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	let FB: any;
	let error: string | null = null;
	let cancelled = false;

	onMount(() => {
		if (
			!env.PUBLIC_WHATSAPP_APP_ID ||
			!env.PUBLIC_WHATSAPP_CONFIG_ID ||
			!env.PUBLIC_WHATSAPP_SOLUTION_ID
		) {
			error = 'WhatsApp configuration invalid';
			console.error(
				'WhatsApp configuration invalid',
				env.PUBLIC_WHATSAPP_APP_ID,
				env.PUBLIC_WHATSAPP_CONFIG_ID,
				env.PUBLIC_WHATSAPP_SOLUTION_ID
			);
			return;
		} else {
			console.log(
				'WhatsApp configuration valid',
				env.PUBLIC_WHATSAPP_APP_ID,
				env.PUBLIC_WHATSAPP_CONFIG_ID,
				env.PUBLIC_WHATSAPP_SOLUTION_ID
			);
		}
		(window as any).fbAsyncInit = function () {
			console.log('fbAsyncInit');
			(window as any).FB.init({
				appId: env.PUBLIC_WHATSAPP_APP_ID, // Facebook App ID
				cookie: true,
				xfbml: true,
				version: 'v22.0' // Graph API version
			});
			console.log('FB', (window as any).FB);
		};
		(function (d, s, id) {
			var js,
				fjs = d.getElementsByTagName(s)[0];
			if (d.getElementById(id)) return;
			js = d.createElement(s) as HTMLScriptElement;
			js.id = id;
			js.setAttribute('defer', 'true');
			js.src = 'https://connect.facebook.net/en_US/sdk.js';
			fjs?.parentNode?.insertBefore(js, fjs);
		})(document, 'script', 'facebook-jssdk');

		window.addEventListener('message', sessionInfoListener);
	});
	import { appState } from '$lib/state.svelte';

	const sessionInfoListener = async (event: MessageEvent) => {
		error = null;
		if (!event.origin?.endsWith('facebook.com')) return;
		try {
			const data = JSON.parse(event.data);
			if (data.type !== 'WA_EMBEDDED_SIGNUP') return;

			if (data.event === 'FINISH') {
				const { phone_number_id, waba_id } = data.data;
				if (appState.organizationId && appState.activeOrganization.data) {
					const result = z.mutate(
						mutators.organization.updateWhatsappSettings({
							metadata: {
								organizationId: appState.organizationId,
								existingSettings: appState.activeOrganization.data.settings
							},
							input: {
								number: phone_number_id,
								wabaId: waba_id
							}
						})
					);
				}
			} else if (data.event === 'ERROR') {
				error = data.data.error_message;
			} else {
				cancelled = true;
			}
		} catch {
			error = 'An error occurred while processing the WhatsApp signup';
		}
	};

	// --- Launch signup ---
	async function launchWhatsAppSignup() {
		try {
			(window as any).FB.login(
				function (response: any) {
					if (!response.authResponse) cancelled = true;
				},
				{
					config_id: env.PUBLIC_WHATSAPP_CONFIG_ID,
					response_type: 'code',
					override_default_response_type: true,
					extras: {
						sessionInfoVersion: 3,
						setup: { solutionID: env.PUBLIC_WHATSAPP_SOLUTION_ID }
					}
				}
			);
		} catch (e) {
			console.error('Error launching signup:', e);
			error = 'Failed to start WhatsApp signup';
		}
	}
</script>

{#if error}
	<Alert title="Error" variant="destructive" class="mb-4">{error}</Alert>
{/if}
{#if cancelled}
	<Alert title="Cancelled" variant="default" class="mb-4">
		{t`The WhatsApp signup was cancelled. If you want to try again, click the button below.`}
	</Alert>
{/if}

{#if appState.activeOrganization?.data?.settings.whatsApp.wabaId && appState.activeOrganization?.data?.settings.whatsApp.number}
	<Card.Root>
		<Card.Header>
			<Card.Title>{t`WhatsApp Business Account Activated`}</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-2 text-sm text-muted-foreground">
			<p>
				{t`Your WhatsApp Business Account has been created successfully. You can now use WhatsApp
				messaging features.`}
			</p>
			<p>
				{t`Your WhatsApp Business Account number is ${
					appState.activeOrganization?.data?.settings.whatsApp.number
				}`}.
			</p>
			<p>
				{t`Your WhatsApp Business Account ID is ${
					appState.activeOrganization?.data?.settings.whatsApp.wabaId
				}`}.
			</p>
		</Card.Content>
	</Card.Root>
{:else}
	<Card.Root>
		<Card.Header>
			<Card.Title>{t`WhatsApp Business Account`}</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-2 text-sm text-muted-foreground">
			<p>
				{t`A whatsapp business account is required to use WhatsApp messaging features. You can create
				one by clicking the button below.`}
			</p>
			<p>
				{t`When you launch the WhatsApp signup, you will be required to login to your Facebook account
				and create a WhatsApp Business Account.`}
			</p>
			<p>
				{t`In doing so, you will authorize Belcoda to send and receive messages on your behalf.`}
			</p>
			<p>
				{t`After creating the WhatsApp Business Account, you will be redirected back to Belcoda.`}
			</p>
		</Card.Content>
		<Card.Footer>
			<Button onclick={launchWhatsAppSignup} variant="default" size="sm"
				>{t`Launch WhatsApp signup`}</Button
			>
		</Card.Footer>
	</Card.Root>
{/if}
