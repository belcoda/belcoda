<script lang="ts">
	import { z } from '$lib/zero.svelte';
	import { appState } from '$lib/state.svelte';
	import { readEmailMessage } from '$lib/zero/query/email_message/read';
	import { page } from '$app/state';
	import { formatShortTimestamp } from '$lib/utils/date';
	import { Button } from '$lib/components/ui/button';

	const emailId = $derived(page.params.id);

	const emailQuery = $derived.by(() =>
		z.createQuery(
			readEmailMessage(appState.queryContext, {
				organizationId: appState.organizationId,
				emailMessageId: emailId
			})
		)
	);

	const email = $derived(emailQuery.data);
</script>

{#if email}
	<div class="flex h-full flex-col">
		<div class="border-b p-4">
			<div class="flex items-center justify-between">
				<div>
					<h2 class="text-xl font-semibold">{email.subject || '(No subject)'}</h2>
					<p class="text-sm text-muted-foreground">
						Sent {formatShortTimestamp(email.startedAt || email.createdAt)}
					</p>
				</div>
				<div class="flex gap-2">
					<Button variant="outline" size="sm">
						View Stats
					</Button>
				</div>
			</div>
		</div>

		<div class="flex-1 overflow-auto p-6">
			<div class="mx-auto max-w-4xl space-y-6">
				<div>
					<h3 class="mb-2 text-sm font-medium text-muted-foreground">Recipients</h3>
					<p>{email.estimatedRecipientCount} recipients</p>
					<div class="mt-2 text-sm text-muted-foreground">
						<p>Successful: {email.successfulRecipientCount}</p>
						<p>Failed: {email.failedRecipientCount}</p>
					</div>
				</div>

				{#if email.previewTextOverride}
					<div>
						<h3 class="mb-2 text-sm font-medium text-muted-foreground">Preview Text</h3>
						<p class="text-sm">{email.previewTextOverride}</p>
					</div>
				{/if}

				<div>
					<h3 class="mb-2 text-sm font-medium text-muted-foreground">Message</h3>
					<div class="rounded-lg border bg-muted/50 p-4">
						{#if email.body}
							<div class="prose prose-sm max-w-none">
								{@html email.body}
							</div>
						{:else}
							<p class="text-muted-foreground">(No content)</p>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
{:else}
	<div class="flex h-full items-center justify-center">
		<p class="text-muted-foreground">Loading...</p>
	</div>
{/if}
