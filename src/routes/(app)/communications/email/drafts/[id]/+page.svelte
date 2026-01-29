<script lang="ts">
	import EmailForm from '$lib/components/forms/email/EmailForm.svelte';
	import { z } from '$lib/zero.svelte';
	import { appState } from '$lib/state.svelte';
	import { readEmailMessage } from '$lib/zero/query/email_message/read';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	const emailId = $derived(page.params.id);

	const emailQuery = $derived.by(() => {
		if (!emailId) return null;
		return z.createQuery(
			readEmailMessage(appState.queryContext, {
				emailMessageId: emailId
			})
		);
	});

	const email = $derived(emailQuery?.data);

	async function handleSave(data: any) {
		if (!emailId) return;
		
		await z.mutate.emailMessage.update({
			metadata: {
				organizationId: appState.organizationId,
				emailMessageId: emailId
			},
			input: {
				subject: data.subject,
				body: data.body
			}
		});
	}

	async function handleSend(data: any) {
		if (!emailId) return;
		
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

	async function handleDiscard() {
		if (!emailId) return;
		
		await z.mutate.emailMessage.delete({
			id: emailId,
			organizationId: appState.organizationId
		});
		
		goto('/communications/email/drafts');
	}
</script>

{#if !emailId}
	<div class="flex h-full items-center justify-center">
		<p class="text-muted-foreground">Invalid email ID</p>
	</div>
{:else if email}
	<EmailForm {email} onSave={handleSave} onSend={handleSend} onDiscard={handleDiscard} />
{:else}
	<div class="flex h-full items-center justify-center">
		<p class="text-muted-foreground">Loading...</p>
	</div>
{/if}
