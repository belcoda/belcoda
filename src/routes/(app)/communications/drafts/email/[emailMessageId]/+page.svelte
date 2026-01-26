<script lang="ts">
	import { page } from '$app/stores';
	import { z } from '$lib/zero.svelte';
	import { appState, getListFilter } from '$lib/state.svelte';
	import { readEmailMessage } from '$lib/zero/query/email_message/read';
	import { listEmailFromSignatures } from '$lib/zero/query/email_from_signature/list';
	import DraftEmailForm from '../_components/DraftEmailForm.svelte';
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import * as Empty from '$lib/components/ui/empty';
	import Mail from '@lucide/svelte/icons/mail';

	const emailMessageId = $derived($page.params.emailMessageId ?? '');

	const emailMessageQuery = $derived.by(() =>
		z.createQuery(readEmailMessage(appState.queryContext, { emailMessageId }))
	);

	const fromSignaturesFilter = $state({
		...getListFilter(appState.organizationId),
		pageSize: 50
	});

	const fromSignaturesQuery = $derived.by(() =>
		z.createQuery(listEmailFromSignatures(appState.queryContext, fromSignaturesFilter))
	);

	const emailMessage = $derived(emailMessageQuery.data);
	const fromSignatures = $derived(fromSignaturesQuery.data ?? []);
</script>

<ContentLayout rootLink="/communications">
	{#if emailMessage && fromSignatures.length > 0}
		<DraftEmailForm {emailMessage} {fromSignatures} />
	{:else if emailMessage === undefined}
		<div class="flex h-screen items-center justify-center">
			<div class="text-center">
				<div class="mb-4 text-lg">Loading draft...</div>
			</div>
		</div>
	{:else}
		<Empty.Root>
			<Empty.Header>
				<Empty.Media variant="icon">
					<Mail />
				</Empty.Media>
				<Empty.Title>Draft not found</Empty.Title>
				<Empty.Description>
					The email draft you're looking for doesn't exist or has been deleted.
				</Empty.Description>
			</Empty.Header>
		</Empty.Root>
	{/if}
</ContentLayout>
