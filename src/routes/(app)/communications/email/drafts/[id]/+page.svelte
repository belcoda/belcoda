<script lang="ts">
	import { t } from '$lib/index.svelte';
	import FlaskConicalIcon from '@lucide/svelte/icons/flask-conical';
	import { z } from '$lib/zero.svelte';
	import { appState } from '$lib/state.svelte';
	import { createDefaultEmailMessage } from '$lib/schema/email-message';
	import queries from '$lib/zero/query/index';
	import { page } from '$app/state';
	import { goto, replaceState } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { toast } from 'svelte-sonner';
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import EmailDraftForm from './EmailDraftForm.svelte';

	const defaultCreateMode = page.url.searchParams.get('defaultCreateMode') === 'true';
	replaceState(page.url.pathname, {});

	const emailId = $derived(page.params.id);

	const emailQuery = $derived.by(() => {
		if (!emailId) return null;
		return z.createQuery(queries.emailMessage.read({ emailMessageId: emailId }));
	});

	const emailExists = $derived(!!(emailQuery?.details.type === 'complete' && emailQuery?.data));
	const emailSearchComplete = $derived(emailQuery?.details.type === 'complete');

	const email = $derived.by(() => {
		if (!emailId) return null;
		const defaultEmail = createDefaultEmailMessage({
			id: emailId,
			organizationId: appState.organizationId,
			teamId: appState.activeTeamId
		});
		if (emailQuery?.details.type === 'complete' && emailQuery?.data) {
			return emailQuery.data;
		}
		if (emailQuery?.details.type === 'unknown' && defaultCreateMode) {
			return defaultEmail;
		}
		if (emailQuery?.details.type === 'complete' && !emailQuery?.data) {
			return defaultEmail;
		}
		return null;
	});

	let formRef = $state<ReturnType<typeof EmailDraftForm> | null>(null);
</script>

<ContentLayout rootLink="/communications/email/drafts">
	{#snippet header()}
		<div class="flex items-center justify-between">
			<h1 class="text-2xl font-bold">{t`Email Draft`}</h1>
		</div>
	{/snippet}
	{#snippet footer()}
		<div class="flex w-full justify-end gap-2">
			<Button
				variant="destructive"
				size="sm"
				data-testid="email-draft-discard"
				onclick={async () => {
					if (window.confirm(t`Are you sure you want to discard this email draft?`)) {
						await formRef?.discard();
						goto('/communications/email/drafts');
					}
				}}>{t`Discard`}</Button
			>
			<Button
				variant="outline"
				size="sm"
				data-testid="email-draft-save"
				onclick={async () => {
					await formRef?.save();
					toast.success(t`Email saved`);
				}}>{t`Save`}</Button
			>
			<Button
				variant="outline"
				size="sm"
				data-testid="email-draft-test-toggle"
				onclick={() => formRef?.toggleTestEmail()}
			>
				<FlaskConicalIcon class="size-4" />
				{t`Test email`}
			</Button>
			<Button
				variant="default"
				size="sm"
				data-testid="email-draft-send"
				onclick={async () => {
					await formRef?.send();
					goto('/communications/email/sent');
				}}>{t`Send`}</Button
			>
		</div>
	{/snippet}
	{#if !emailId}
		<div data-testid="email-draft-page-invalid" class="flex h-full items-center justify-center">
			<p class="text-muted-foreground">{t`Invalid email ID`}</p>
		</div>
	{:else if emailSearchComplete && email}
		{#key email.id}
			<div data-testid="email-draft-page">
				<EmailDraftForm bind:this={formRef} {email} {emailExists} />
			</div>
		{/key}
	{/if}
</ContentLayout>
