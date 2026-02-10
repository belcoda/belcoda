<script lang="ts">
	import { t } from '$lib/index.svelte';
	import EmailForm from '$lib/components/forms/email/EmailForm.svelte';
	import { z } from '$lib/zero.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import { appState } from '$lib/state.svelte';
	import { createDefaultEmailMessage } from '$lib/schema/email-message';
	import queries from '$lib/zero/query/index';
	import { page } from '$app/state';
	import { goto, replaceState } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import type { FilterGroupType } from '$lib/schema/person/filter';

	const defaultCreateMode = page.url.searchParams.get('defaultCreateMode') === 'true';
	replaceState(page.url.pathname, {});

	const emailId = $derived(page.params.id);

	const emailQuery = $derived.by(() => {
		if (!emailId) return null;
		const q = z.createQuery(
			queries.emailMessage.read({
				emailMessageId: emailId
			})
		);
		return q;
	});

	const emailExists = $derived(!!(emailQuery?.details.type === 'complete' && emailQuery?.data));

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
		if (emailQuery?.details.type === 'unknown' && !defaultCreateMode) {
			return null;
		}
		return null;
	});

	type SaveEmailData = {
		subject: string | undefined;
		body: any | undefined;
		emailFromSignatureId: string | undefined;
		recipients: FilterGroupType;
	};
	async function handleUpdate({ subject, body, emailFromSignatureId, recipients }: SaveEmailData) {
		if (!emailId) return;

		if (emailExists) {
			await z.mutate(
				mutators.emailMessage.update({
					metadata: {
						organizationId: appState.organizationId,
						emailMessageId: emailId
					},
					input: {
						subject,
						body,
						emailFromSignatureId,
						recipients
					}
				})
			);
		} else {
			//create the email
			await z.mutate(
				mutators.emailMessage.create({
					metadata: {
						organizationId: appState.organizationId,
						emailMessageId: emailId
					},
					input: {
						subject: subject ?? null,
						body: body ?? null,
						emailFromSignatureId: emailFromSignatureId ?? null,
						recipients,
						previewTextOverride: null,
						previewTextLock: false,
						replyToOverride: null
					}
				})
			);
		}
	}

	async function handleSend(data: any) {
		if (!emailId) return;

		await z.mutate(
			mutators.emailMessage.send({
				metadata: {
					organizationId: appState.organizationId,
					emailMessageId: emailId
				},
				input: {
					subject: data.subject,
					body: data.body
				}
			})
		);

		goto('/communications/email/sent');
	}

	async function handleDiscard() {
		if (window.confirm(t`Are you sure you want to discard this email draft?`)) {
			if (!emailId) return;

			await z.mutate(
				mutators.emailMessage.delete({
					input: {},
					metadata: {
						emailMessageId: emailId,
						organizationId: appState.organizationId
					}
				})
			);

			goto('/communications/email/drafts');
		}
	}
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
</script>

<ContentLayout rootLink="/communications/email/drafts">
	{#snippet header()}
		<div class="flex items-center justify-between">
			<h1 class="text-2xl font-bold">{t`Email Draft`}</h1>
		</div>
	{/snippet}
	{#snippet footer()}
		<div class="flex w-full justify-end gap-2">
			<Button variant="destructive" size="sm" onclick={handleDiscard}>{t`Discard`}</Button>
			<Button variant="default" size="sm" onclick={handleSend}>{t`Send`}</Button>
		</div>
	{/snippet}
	{#if !emailId}
		<div class="flex h-full items-center justify-center">
			<p class="text-muted-foreground">{t`Invalid email ID`}</p>
		</div>
	{:else if email}
		<EmailForm {email} {handleUpdate} />
	{/if}
</ContentLayout>
