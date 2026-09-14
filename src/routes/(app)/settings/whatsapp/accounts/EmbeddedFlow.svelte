<script lang="ts">
	import { t } from '$lib/index.svelte';
	import { env } from '$env/dynamic/public';
	import { onMount } from 'svelte';
	import { dev } from '$app/environment';
	import { Alert } from '$lib/components/ui/alert/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import BusinessAccountActivated from './BusinessAccountActivated.svelte';
	import { z } from '$lib/zero.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import { appState } from '$lib/state.svelte';

	const MOCK_PHONE_NUMBER_ID = '15551234567';
	const MOCK_WABA_ID = 'mock-waba-embedded-signup';

	let { mockExternalServices = false }: { mockExternalServices?: boolean } = $props();

	let signupOrganizationId: string | null = null;
	let error: string | null = $state(null);
	let cancelled = $state(false);
	let saving = $state(false);

	onMount(() => {
		const account = appState.activeOrganization.data?.settings.whatsApp;
		if (account?.wabaId && account.number) return;
		if (!mockExternalServices) {
			if (
				!env.PUBLIC_WHATSAPP_APP_ID ||
				!env.PUBLIC_WHATSAPP_CONFIG_ID ||
				!env.PUBLIC_WHATSAPP_SOLUTION_ID
			) {
				error = t`WhatsApp connection is unavailable right now. Please try again later.`;
				console.error(
					'WhatsApp configuration invalid',
					env.PUBLIC_WHATSAPP_APP_ID,
					env.PUBLIC_WHATSAPP_CONFIG_ID,
					env.PUBLIC_WHATSAPP_SOLUTION_ID
				);
				return;
			}

			(window as any).fbAsyncInit = function () {
				(window as any).FB.init({
					appId: env.PUBLIC_WHATSAPP_APP_ID,
					cookie: true,
					xfbml: true,
					version: 'v22.0'
				});
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
		}

		window.addEventListener('message', sessionInfoListener);
		if (dev) {
			(window as any).__belcodaCompleteWhatsAppSignup = persistWhatsappSettingsFromEmbedded;
		}

		return () => {
			window.removeEventListener('message', sessionInfoListener);
			if (
				dev &&
				(window as any).__belcodaCompleteWhatsAppSignup === persistWhatsappSettingsFromEmbedded
			) {
				delete (window as any).__belcodaCompleteWhatsAppSignup;
			}
		};
	});

	async function persistWhatsappSettingsFromEmbedded(number: string, wabaId: string) {
		if (saving) return;
		const organizationId = appState.optionalOrganizationId;
		const existingSettings = appState.activeOrganization.data?.settings;
		if (
			!organizationId ||
			!existingSettings ||
			(signupOrganizationId && signupOrganizationId !== organizationId)
		) {
			throw new Error('Organization is not ready');
		}
		if (!number || !wabaId) throw new Error('WhatsApp account details are missing');
		saving = true;
		try {
			const result = await z.mutate(
				mutators.organization.updateWhatsappSettings({
					metadata: { organizationId, existingSettings: $state.snapshot(existingSettings) },
					input: { number, wabaId }
				})
			).server;
			if (result.type === 'error') throw new Error(result.error.message);
		} finally {
			saving = false;
		}
	}

	const sessionInfoListener = async (event: MessageEvent) => {
		if (event.origin !== 'https://www.facebook.com' && event.origin !== 'https://web.facebook.com')
			return;
		try {
			const data = JSON.parse(event.data);
			if (data.type !== 'WA_EMBEDDED_SIGNUP' || saving) return;
			error = null;
			cancelled = false;

			if (data.event === 'FINISH') {
				const { phone_number_id, waba_id } = data.data;
				await persistWhatsappSettingsFromEmbedded(phone_number_id, waba_id);
				document.location.reload();
			} else if (data.event === 'ERROR') {
				error = data.data.error_message;
			} else {
				cancelled = true;
			}
		} catch {
			error = t`We couldn't save your WhatsApp connection. Please try again.`;
		}
	};

	// --- Launch signup ---
	async function launchWhatsAppSignup() {
		if (saving) return;
		error = null;
		cancelled = false;
		signupOrganizationId = appState.organizationId;
		if (mockExternalServices) {
			try {
				await persistWhatsappSettingsFromEmbedded(MOCK_PHONE_NUMBER_ID, MOCK_WABA_ID);
				document.location.reload();
			} catch (e) {
				console.error('Error launching signup:', e);
				error = t`We couldn't connect WhatsApp. Please try again.`;
			}
			return;
		}

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
			error = t`We couldn't connect WhatsApp. Please try again.`;
		}
	}
</script>

{#if error}
	<Alert title={t`Connection not completed`} variant="destructive" class="mb-4">{error}</Alert>
{/if}
{#if cancelled}
	<Alert title={t`Connection cancelled`} variant="default" class="mb-4">
		{t`The WhatsApp signup was cancelled. If you want to try again, click the button below.`}
	</Alert>
{/if}

{#if !saving && !error && appState.activeOrganization?.data?.settings.whatsApp.wabaId && appState.activeOrganization?.data?.settings.whatsApp.number}
	<BusinessAccountActivated />
{:else}
	<Card.Root data-testid="whatsapp-accounts-activate-card">
		<Card.Header>
			<Card.Title>{t`Activate WhatsApp Business Account`}</Card.Title>
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
			<Button
				onclick={launchWhatsAppSignup}
				disabled={saving}
				variant="default"
				size="sm"
				data-testid="whatsapp-accounts-launch-signup"
				>{saving ? t`Saving connection…` : t`Launch WhatsApp signup`}</Button
			>
		</Card.Footer>
	</Card.Root>
{/if}
