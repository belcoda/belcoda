<script lang="ts">
	import EmailForm from '$lib/components/forms/email/EmailForm.svelte';
	import { z } from '$lib/zero.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import { appState } from '$lib/state.svelte';
	import { type FilterGroupType, defaultFilterGroup } from '$lib/schema/person/filter';
	import type { ReadEmailMessageZero } from '$lib/schema/email-message';

	let {
		email,
		emailExists
	}: {
		email: ReadEmailMessageZero;
		emailExists: boolean;
	} = $props();

	type SaveEmailData = {
		subject: string | undefined;
		body: any | undefined; // body's type can be different things depending on lexical's config. leaving it as 'any' for now
		emailFromSignatureId: string | undefined;
		recipients: FilterGroupType;
	};

	let subject = $state<string>(email.subject ?? '');
	let body = $state<any>(email.body ?? null);
	let emailFromSignatureId = $state<string | undefined>(email.emailFromSignatureId ?? undefined);
	let recipients = $state<FilterGroupType>(
		JSON.parse(JSON.stringify(email.recipients || defaultFilterGroup))
	);

	async function persist(data?: SaveEmailData) {
		if (data) {
			subject = data.subject ?? '';
			body = data.body ?? null;
			emailFromSignatureId = data.emailFromSignatureId;
			recipients = data.recipients
				? JSON.parse(JSON.stringify(data.recipients))
				: JSON.parse(JSON.stringify(defaultFilterGroup));
		}

		if (emailExists) {
			await z.mutate(
				mutators.emailMessage.update({
					metadata: { organizationId: appState.organizationId, emailMessageId: email.id },
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
					metadata: { organizationId: appState.organizationId, emailMessageId: email.id },
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

	export async function save() {
		await persist();
	}

	export async function send() {
		await persist();
		await z.mutate(
			mutators.emailMessage.send({
				metadata: { organizationId: appState.organizationId, emailMessageId: email.id },
				input: {
					subject: $state.snapshot(subject),
					body: $state.snapshot(body)
				}
			})
		);
	}

	export async function discard() {
		await z.mutate(
			mutators.emailMessage.delete({
				id: email.id,
				organizationId: appState.organizationId
			})
		);
	}
</script>

<EmailForm bind:subject bind:body bind:recipients bind:emailFromSignatureId handleUpdate={persist} />
