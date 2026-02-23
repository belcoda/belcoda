<script lang="ts">
	import { t } from '$lib/index.svelte';
	import { generateWhatsAppQRCode } from '$lib/utils/qr';
	import ResponsiveModal from '$lib/components/ui/responsive-modal/responsive-modal.svelte';
	import QrCode from '@lucide/svelte/icons/qr-code';
	import ExternalLink from '@lucide/svelte/icons/external-link';

	type Props = {
		directLink?: boolean;
		whatsAppSignupLink: string;
	};
	const { directLink = false, whatsAppSignupLink }: Props = $props();

	let showQRModal = $state(false);
	let qrCodeDataUrl = $state('');
	let whatsappUrl = $state('');

	async function handleWhatsAppSignup() {
		try {
			whatsappUrl = whatsAppSignupLink;
			if (directLink) {
				handleDirectLink();
				return;
			}
			qrCodeDataUrl = await generateWhatsAppQRCode(whatsappUrl);
			showQRModal = true;
		} catch (err) {
			console.error(err);
		}
	}

	function handleDirectLink() {
		if (whatsappUrl) {
			window.open(whatsappUrl, '_blank');
		}
	}
	import { Button } from '$lib/components/ui/button/index.js';
</script>

<Button
	type="button"
	class="w-full bg-green-600 text-white transition-colors hover:bg-green-700"
	onclick={handleWhatsAppSignup}
>
	<span class="icon-[ri--whatsapp-line] size-5"></span>
	{t`Sign petition via WhatsApp`}
</Button>

<ResponsiveModal bind:open={showQRModal}>
	<div class="py-6 text-center">
		<div class="mb-2 flex size-8 w-full justify-center">
			<span class="icon-[logos--whatsapp-icon] size-8"></span>
		</div>

		<h3 class="mb-2 text-lg font-semibold text-gray-900">{t`Sign petition via WhatsApp`}</h3>
		<p class="mb-6 text-sm text-gray-600">{t`Choose how you'd like to sign this petition.`}</p>

		<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:justify-center">
			<button
				type="button"
				class="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
				onclick={handleDirectLink}
			>
				<ExternalLink class="h-4 w-4" />
				{t`Open WhatsApp`}
			</button>
		</div>

		{#if qrCodeDataUrl}
			<div class="mb-6 border-t border-gray-200 pt-6">
				<div class="mb-4 flex items-center justify-center gap-2">
					<QrCode class="h-5 w-5 text-gray-600" />
					<span class="text-sm font-medium text-gray-900">{t`Or scan QR code`}</span>
				</div>
				<div class="flex flex-col items-center gap-4">
					<img src={qrCodeDataUrl} alt={t`WhatsApp Petition Signup QR Code`} class="rounded-lg border" />
					<p class="text-xs text-gray-500">{t`Scan with your phone to sign via WhatsApp`}</p>
				</div>
			</div>
		{/if}
	</div>
	{#snippet footer()}
		<button
			type="button"
			class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
			onclick={() => (showQRModal = false)}
		>
			{t`Close`}
		</button>
	{/snippet}
</ResponsiveModal>
