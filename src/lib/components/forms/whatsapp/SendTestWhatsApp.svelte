<script lang="ts">
	import { t } from '$lib/index.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { toast } from 'svelte-sonner';

	let {
		whatsappThreadId,
		beforeSend,
		onSent
	}: {
		whatsappThreadId: string;
		beforeSend: () => Promise<void>;
		onSent?: () => void;
	} = $props();

	let phoneNumber = $state('');
	let loading = $state(false);

	const canSend = $derived(!loading && phoneNumber.trim().length > 0);

	async function sendTestWhatsApp() {
		if (!canSend) return;
		loading = true;
		const trimmedPhoneNumber = phoneNumber.trim();
		try {
			await beforeSend();
			const response = await fetch(`/api/utils/whatsapp/send_test_whatsapp/${whatsappThreadId}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ phoneNumber: trimmedPhoneNumber })
			});
			if (!response.ok) {
				const data = await response.json().catch(() => ({}));
				toast.error(data?.message ?? t`Failed to send test WhatsApp`);
			} else {
				toast.success(t`Test WhatsApp sent to ${trimmedPhoneNumber}`);
				onSent?.();
			}
		} catch {
			toast.error(t`Failed to send test WhatsApp`);
		} finally {
			loading = false;
		}
	}
</script>

<div class="space-y-3">
	<div class="space-y-1.5">
		<Label for="test-whatsapp-phone-number">{t`Send test WhatsApp to`}</Label>
		<Input
			id="test-whatsapp-phone-number"
			type="tel"
			placeholder="+14155552671"
			bind:value={phoneNumber}
			class="w-full"
		/>
		<p class="text-sm text-muted-foreground">{t`Include country code, e.g. +14101234567`}</p>
	</div>
	<Button disabled={!canSend} onclick={sendTestWhatsApp} class="w-full">
		{loading ? t`Sending...` : t`Send test WhatsApp`}
	</Button>
</div>
