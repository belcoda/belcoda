<script lang="ts">
	import { t } from '$lib/index.svelte';
	import { z } from '$lib/zero.svelte';
	import { appState } from '$lib/state.svelte';
	import { readEmailMessage } from '$lib/zero/query/email_message/read';
	import { page } from '$app/state';
	import { formatShortTimestamp } from '$lib/utils/date';
	import { Button } from '$lib/components/ui/button';
	import SvelteLexical from '$lib/components/ui/wysiwyg/SvelteLexical.svelte';

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
</script>

{#if !emailId}
	<div class="flex h-full items-center justify-center">
		<p class="text-muted-foreground">{t`Invalid email ID`}</p>
	</div>
{:else if email}
	<div class="flex h-full flex-col">
		<div class="border-b p-4">
			<div class="flex items-center justify-between">
				<div>
					<h2 class="text-xl font-semibold">{email.subject || t`(No subject)`}</h2>
					<p class="text-sm text-muted-foreground">
						{t`Sent`}
						{formatShortTimestamp(email.startedAt || email.createdAt)}
					</p>
				</div>
				<div class="flex gap-2">
					<Button variant="outline" size="sm">{t`View Stats`}</Button>
				</div>
			</div>
		</div>

		<div class="flex-1 overflow-auto p-6">
			<div class="mx-auto max-w-4xl space-y-6">
				<div>
					<h3 class="mb-2 text-sm font-medium text-muted-foreground">{t`Recipients`}</h3>
					<p>{email.estimatedRecipientCount} {t`recipients`}</p>
					<div class="mt-2 text-sm text-muted-foreground">
						<p>{t`Successful`}: {email.successfulRecipientCount}</p>
						<p>{t`Failed`}: {email.failedRecipientCount}</p>
					</div>
				</div>

				{#if email.previewTextOverride}
					<div>
						<h3 class="mb-2 text-sm font-medium text-muted-foreground">{t`Preview Text`}</h3>
						<p class="text-sm">{email.previewTextOverride}</p>
					</div>
				{/if}

				<div>
					<h3 class="mb-2 text-sm font-medium text-muted-foreground">{t`Message`}</h3>
					{#if email.body}
						<SvelteLexical value={email.body} disabled={true} />
					{:else}
						<p class="text-muted-foreground">{t`(No content)`}</p>
					{/if}
				</div>
			</div>
		</div>
	</div>
{:else}
	<div class="flex h-full items-center justify-center">
		<p class="text-muted-foreground">{t`Loading...`}</p>
	</div>
{/if}
