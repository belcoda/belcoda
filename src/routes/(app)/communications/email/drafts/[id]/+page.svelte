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
	import { type FilterGroupType, defaultFilterGroup } from '$lib/schema/person/filter';
	import { watch } from 'runed';

	import { toast } from 'svelte-sonner';
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

	// SaveEmailData as $state runes (future bindables for EmailForm)
	let subject = $state<string>('');
	let body = $state<any>(null);
	let emailFromSignatureId = $state<string | undefined>(undefined);
	let recipients = $state<FilterGroupType>(JSON.parse(JSON.stringify(defaultFilterGroup)));

	// Sync state from email (Zero query data or default) when it changes
	watch(
		() => email,
		(curr) => {
			if (curr) {
				subject = curr.subject ?? '';
				body = curr.body ?? null;
				emailFromSignatureId = curr.emailFromSignatureId ?? undefined;
				recipients = JSON.parse(JSON.stringify(curr.recipients || defaultFilterGroup));
			}
		}
	);

	async function handleUpdate(data?: SaveEmailData) {
		// Update state from form callback (until EmailForm uses bindables)
		if (data) {
			subject = data.subject ?? '';
			body = data.body ?? null;
			emailFromSignatureId = data.emailFromSignatureId;
			recipients = data.recipients
				? JSON.parse(JSON.stringify(data.recipients))
				: JSON.parse(JSON.stringify(defaultFilterGroup));
		}

		if (!emailId) return;

		if (emailExists) {
			await z.mutate(
				mutators.emailMessage.update({
					metadata: {
						organizationId: appState.organizationId,
						emailMessageId: emailId
					},
					input: {
						subject: $state.snapshot(subject),
						body: $state.snapshot(body),
						emailFromSignatureId: $state.snapshot(emailFromSignatureId),
						recipients: $state.snapshot(recipients)
					}
				})
			);
		} else {
			await z.mutate(
				mutators.emailMessage.create({
					metadata: {
						organizationId: appState.organizationId,
						emailMessageId: emailId
					},
					input: {
						subject: $state.snapshot(subject) ?? null,
						body: $state.snapshot(body) ?? null,
						emailFromSignatureId: $state.snapshot(emailFromSignatureId) ?? null,
						recipients: $state.snapshot(recipients),
						previewTextOverride: null,
						previewTextLock: false,
						replyToOverride: null
					}
				})
			);
		}
	}

	async function handleSend() {
		await handleUpdate();
		if (!emailId) return;

		await z.mutate(
			mutators.emailMessage.send({
				metadata: {
					organizationId: appState.organizationId,
					emailMessageId: emailId
				},
				input: {
					subject,
					body
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
					id: emailId,
					organizationId: appState.organizationId
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
			<Button
				variant="outline"
				size="sm"
				onclick={() => {
					handleUpdate();
					toast.success(t`Email saved`);
				}}>{t`Save`}</Button
			>
			<Button variant="default" size="sm" onclick={handleSend}>{t`Send`}</Button>
		</div>
	{/snippet}
	{#if !emailId}
		<div class="flex h-full items-center justify-center">
			<p class="text-muted-foreground">{t`Invalid email ID`}</p>
		</div>
	{:else if emailSearchComplete}
		<EmailForm bind:subject bind:body bind:recipients bind:emailFromSignatureId {handleUpdate} />
	{/if}
</ContentLayout>
