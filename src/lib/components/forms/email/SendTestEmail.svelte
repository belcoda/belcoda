<script lang="ts">
	import { t } from '$lib/index.svelte';
	import { appState } from '$lib/state.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { toast } from 'svelte-sonner';

	let { emailMessageId, beforeSend }: { emailMessageId: string; beforeSend: () => Promise<void> } =
		$props();

	let emailAddress = $state(appState.user.data?.email ?? '');
	let loading = $state(false);

	const canSend = $derived(!loading && emailAddress.trim().length > 0);

	async function sendTestEmail() {
		if (!canSend) return;
		loading = true;
		const trimmedAddress = emailAddress.trim();
		try {
			await beforeSend();
			const response = await fetch(`/api/utils/email/send_test_email/${emailMessageId}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ emailAddress: trimmedAddress })
			});
			if (!response.ok) {
				const data = await response.json().catch(() => ({}));
				toast.error(data?.message ?? t`Failed to send test email`);
			} else {
				toast.success(t`Test email sent to ${trimmedAddress}`);
			}
		} catch {
			toast.error(t`Failed to send test email`);
		} finally {
			loading = false;
		}
	}
</script>

<div class="space-y-3">
	<div class="space-y-1.5">
		<Label for="test-email-address">{t`Send test email to`}</Label>
		<Input
			id="test-email-address"
			type="email"
			placeholder={t`Email address`}
			bind:value={emailAddress}
			class="w-full"
		/>
	</div>
	<Button disabled={!canSend} onclick={sendTestEmail} class="w-full">
		{loading ? t`Sending...` : t`Send test email`}
	</Button>
</div>
