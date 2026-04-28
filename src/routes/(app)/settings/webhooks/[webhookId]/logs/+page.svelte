<script lang="ts">
	import { t } from '$lib/index.svelte';
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';
	import * as Table from '$lib/components/ui/table/index.js';
	import H2 from '$lib/components/ui/typography/H2.svelte';
	import { page } from '$app/state';
	import { formatShortTimestamp } from '$lib/utils/date';

	const webhookId = $derived(page.params.webhookId ?? '');

	const webhook = $derived.by(() => z.createQuery(queries.webhook.read({ webhookId })));
	const logRows = $derived.by(() => z.createQuery(queries.webhookLog.list({ webhookId })));

	function formatPayload(value: unknown | null | undefined): string {
		if (value == null) {
			return '—';
		}
		try {
			return JSON.stringify(value, null, 2);
		} catch {
			return String(value);
		}
	}

	function formatResponseText(value: string | null | undefined): string {
		if (value == null || value === '') {
			return '—';
		}
		return value;
	}
</script>

<ContentLayout rootLink="/settings/webhooks" {header} bodyPadding="p-4">
	<div class="space-y-4" data-testid="settings-webhook-logs">
		{#if logRows.details.type !== 'complete' || !logRows.data}
			<p class="py-8 text-center text-muted-foreground">{t`Loading delivery logs...`}</p>
		{:else if logRows.data.length === 0}
			<p class="py-8 text-center text-muted-foreground">{t`No delivery logs yet`}</p>
		{:else}
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head class="w-[1%] whitespace-nowrap">{t`Time`}</Table.Head>
						<Table.Head class="w-[1%] whitespace-nowrap">{t`Event`}</Table.Head>
						<Table.Head class="w-[1%] whitespace-nowrap">{t`Status`}</Table.Head>
						<Table.Head class="w-[1%] text-right whitespace-nowrap">{t`HTTP`}</Table.Head>
						<Table.Head class="w-[1%] text-right whitespace-nowrap">{t`Attempt`}</Table.Head>
						<Table.Head class="min-w-0">{t`Payload`}</Table.Head>
						<Table.Head class="min-w-0">{t`Response`}</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each logRows.data as row (row.id)}
						<Table.Row>
							<Table.Cell class="align-top text-sm whitespace-nowrap text-muted-foreground"
								>{formatShortTimestamp(row.createdAt)}</Table.Cell
							>
							<Table.Cell class="align-top font-mono text-sm whitespace-nowrap"
								>{row.eventType}</Table.Cell
							>
							<Table.Cell class="align-top text-sm whitespace-nowrap">{row.status}</Table.Cell>
							<Table.Cell class="text-right align-top text-sm whitespace-nowrap tabular-nums"
								>{row.httpStatusCode ?? '—'}</Table.Cell
							>
							<Table.Cell class="text-right align-top text-sm whitespace-nowrap tabular-nums"
								>{row.attemptNumber}</Table.Cell
							>
							<Table.Cell class="max-w-md min-w-0 align-top">
								<pre
									class="max-h-40 overflow-auto rounded-md border bg-muted/40 p-2 font-mono text-xs break-all whitespace-pre-wrap">{formatPayload(
										row.payload
									)}</pre>
							</Table.Cell>
							<Table.Cell class="max-w-md min-w-0 align-top">
								<pre
									class="max-h-40 overflow-auto rounded-md border bg-muted/40 p-2 font-mono text-xs break-all whitespace-pre-wrap">{formatResponseText(
										row.responseBody
									)}</pre>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		{/if}
	</div>
</ContentLayout>

{#snippet header()}
	<div class="min-w-0">
		<H2 className="truncate">
			{#if webhook.details.type === 'complete' && webhook.data}
				{t`Delivery logs`} — {webhook.data.name}
			{:else}
				{t`Delivery logs`}
			{/if}
		</H2>
	</div>
{/snippet}
