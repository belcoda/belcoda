<script lang="ts">
	import { goto } from '$app/navigation';
	import { v7 as uuidv7 } from 'uuid';
	import { z } from '$lib/zero.svelte';
	import { appState } from '$lib/state.svelte';

	const newDraftId = uuidv7();
	const defaultFromSignatureId = $derived(
		appState.activeOrganization.data?.settings.email.defaultFromSignatureId
	);

	async function createDraft() {
		if (!defaultFromSignatureId) {
			goto('/settings/email/send_signatures');
			return;
		}

		const draft = z.mutate.emailMessage.create({
			metadata: {
				emailMessageId: newDraftId,
				organizationId: appState.organizationId
			},
			input: {
				emailFromSignatureId: defaultFromSignatureId,
				replyToOverride: null,
				recipients: {
					type: 'or' as const,
					filters: [],
					exclude: []
				},
				previewTextOverride: null,
				previewTextLock: false,
				subject: null,
				body: null
			}
		});
		await draft.client;
		goto(`/communications/drafts/email/${newDraftId}`);
	}

	createDraft();
</script>

<div class="flex h-screen items-center justify-center">
	<div class="text-center">
		<div class="mb-4 text-lg">Creating new draft...</div>
		<div class="text-muted-foreground text-sm">Please wait</div>
	</div>
</div>
