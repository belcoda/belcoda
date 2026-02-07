<script lang="ts">
	import { getAppState } from '$lib/state.svelte'; const appState = getAppState();;
	import { type ReadEventZero } from '$lib/schema/event';
	import { type ReadActionCodeZero } from '$lib/schema/action-code';
	import { z } from '$lib/zero.svelte';
	const { event, actionCode }: { event: ReadEventZero; actionCode: ReadActionCodeZero } = $props();
	import { t } from '$lib/index.svelte';
	import { env } from '$env/dynamic/public';
	const whatsAppCheckinLink = $derived.by(() => {
		return `https://wa.me/${appState.activeOrganization.data?.settings.whatsApp.number || env.PUBLIC_DEFAULT_WHATSAPP_NUMBER}/?text=${encodeURIComponent(`Send to check in to ${event.title} [#${actionCode.id}] (do not edit this message)`)}`;
	});
	import { Button } from '$lib/components/ui/button/index.js';
	import { toast } from 'svelte-sonner';
	import CheckIcon from '@lucide/svelte/icons/check';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import CopyIcon from '@lucide/svelte/icons/copy';
	let copied = $state(false);
	import { generateWhatsAppQRCode } from '$lib/utils/qr';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
</script>

<div class="mt-3 grid w-full max-w-md gap-4">
	<div class="text-sm text-muted-foreground">{t`Scan this QR code to mark attendance via WhatsApp`}</div>
	{#await generateWhatsAppQRCode(whatsAppCheckinLink)}
		<div class="flex items-center justify-center">
			<Skeleton class="aspect-square size-24" />
		</div>
	{:then qrCode}
		<img src={qrCode} alt={t`WhatsApp checkin link`} class="mx-auto" />
		<Button
			variant="outline"
			onclick={() => {
				const link = document.createElement('a');
				link.href = qrCode;
				link.download = `event-${event.slug}-checkin-qr-code.png`;
				link.click();
			}}
		>
			<DownloadIcon /> {t`Download QR code`}</Button
		>
	{/await}
	<Button
		variant="outline"
		onclick={() => {
			navigator.clipboard.writeText(whatsAppCheckinLink);
			toast.success(t`Copied to clipboard`);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 1000);
		}}
	>
		{#if copied}<CheckIcon /> {t`Copied!`}
		{:else}<CopyIcon />{t`Copy WhatsApp checkin link`}{/if}
	</Button>
</div>
