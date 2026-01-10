<script lang="ts">
	import { t } from '$lib';
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import { z } from '$lib/zero.svelte';
	import { getListFilter, appState } from '$lib/state.svelte';
	import { listEmailFromSignatures } from '$lib/zero/query/email_from_signature/list';
	let emailFromSignatureListFilter = $state({
		...getListFilter(appState.organizationId)
	});
	const emailFromSignatureList = $derived.by(() =>
		z.createQuery(listEmailFromSignatures(appState.queryContext, emailFromSignatureListFilter))
	);
	import ResponsiveModal from '$lib/components/ui/responsive-modal/responsive-modal.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import H2 from '$lib/components/ui/typography/H2.svelte';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
</script>

<ContentLayout rootLink="/settings">
	<Alert.Root>
		<AlertCircleIcon />
		<Alert.Title>{t`Email from signatures`}</Alert.Title>
		<Alert.Description>
			<p>
				{t`Email from signatures are the names and email addresses that are used to send emails on behalf
  of the organization. You can add as many as you want, but they must be attached to a
  non-public email address that you control.`}
			</p>
		</Alert.Description>
	</Alert.Root>
	<Card.Root>
		<Card.Content>
			{#each emailFromSignatureList.data as emailFromSignature}
				<div>{emailFromSignature.name}</div>
			{/each}
		</Card.Content>
	</Card.Root>
	{#snippet header()}
		<div class="flex items-center justify-between">
			<H2>Email from signatures</H2>
			<ResponsiveModal>
				<h1>Add Email from signature</h1>
				{#snippet trigger()}
					<Button variant="outline"><PlusIcon /> New</Button>
				{/snippet}
			</ResponsiveModal>
		</div>
	{/snippet}
</ContentLayout>
