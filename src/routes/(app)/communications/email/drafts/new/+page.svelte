<script lang="ts">
	import EmailForm from '$lib/components/forms/email/EmailForm.svelte';
	import { goto } from '$app/navigation';
	import { z } from '$lib/zero.svelte';
	import { appState } from '$lib/state.svelte';
	import { v7 as uuidv7 } from 'uuid';

	async function handleSave(data: any) {
		const emailId = uuidv7();
		
		// TODO: Need to get a valid emailFromSignatureId
		// For now, we need to fetch the first available signature or create a default one
		const signatureId = 'temp-signature-id'; // This needs to be replaced with actual signature
		
		await z.mutate.emailMessage.create({
			metadata: {
				organizationId: appState.organizationId,
				emailMessageId: emailId
			},
			input: {
				emailFromSignatureId: signatureId,
				replyToOverride: null,
				recipients: { type: 'or', filters: [], exclude: [] }, // Empty recipients for now
				previewTextOverride: null,
				previewTextLock: false,
				subject: data.subject,
				body: data.body
			}
		});
		
		// Navigate to the newly created draft
		goto(`/communications/email/drafts/${emailId}`);
	}

	function handleSend(data: any) {
		console.log('Send new email:', data);
		// TODO: Implement create and send mutation
	}

	function handleDiscard() {
		goto('/communications/email/drafts');
	}
</script>

<EmailForm email={null} onSave={handleSave} onSend={handleSend} onDiscard={handleDiscard} />
