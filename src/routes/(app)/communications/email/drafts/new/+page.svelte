<script lang="ts">
	import EmailForm from '$lib/components/forms/email/EmailForm.svelte';
	import { goto } from '$app/navigation';
	import { z } from '$lib/zero.svelte';
	import { appState } from '$lib/state.svelte';
	import { v7 as uuidv7 } from 'uuid';

	async function handleSave(data: any) {
		const signatureId = appState.activeOrganization.data?.settings?.email?.defaultFromSignatureId;
		if (!signatureId) {
			console.error('No default email signature configured for this organization');
			return;
		}
		
		const emailId = uuidv7();
		
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

	async function handleSend(data: any) {
		const signatureId = appState.activeOrganization.data?.settings?.email?.defaultFromSignatureId;
		if (!signatureId) {
			console.error('No default email signature configured for this organization');
			return;
		}
		
		const emailId = uuidv7();

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
		
		await z.mutate.emailMessage.send({
			metadata: {
				organizationId: appState.organizationId,
				emailMessageId: emailId
			},
			input: {
				subject: data.subject,
				body: data.body
			}
		});
		
		goto('/communications/email/sent');
	}

	function handleDiscard() {
		goto('/communications/email/drafts');
	}
</script>

<EmailForm email={null} onSave={handleSave} onSend={handleSend} onDiscard={handleDiscard} />
