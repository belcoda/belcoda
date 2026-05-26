<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { t } from '$lib/index.svelte';
	import SendTestWhatsApp from '$lib/components/forms/whatsapp/SendTestWhatsApp.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import FlaskConicalIcon from '@lucide/svelte/icons/flask-conical';
	let open = $state(false);
	import { page } from '$app/state';
	const whatsappThreadId = page.params.whatsappThreadId; //if we don't have a whatsapp thread id, don't show the modal I guess...
</script>

{#if whatsappThreadId}
	<Dialog.Root bind:open>
		<Dialog.Trigger>
			<Button variant="outline" size="sm" data-testid="flow-test-button">
				<FlaskConicalIcon class="size-4" />
				{t`Send test message`}
			</Button>
		</Dialog.Trigger>
		<Dialog.Content class="sm:max-w-md">
			<Dialog.Header>
				<Dialog.Title>{t`Test WhatsApp`}</Dialog.Title>
				<Dialog.Description>
					{t`Send a test message before sending this draft.`}
				</Dialog.Description>
			</Dialog.Header>
			<SendTestWhatsApp
				{whatsappThreadId}
				onSent={() => {
					open = false;
				}}
			/>
		</Dialog.Content>
	</Dialog.Root>
{/if}
