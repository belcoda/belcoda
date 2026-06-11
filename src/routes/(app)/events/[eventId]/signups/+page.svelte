<script lang="ts">
	import { t, locale } from '$lib/index.svelte';
	const { params } = $props();
	import { appState, getListFilter } from '$lib/state.svelte';
	import type { ListEventSignupsInput } from '$lib/zero/query/event_signup/list';
	import { type ReadEventSignupZeroWithPerson } from '$lib/schema/event-signup';
	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';
	import { PaginatedZeroList } from '$lib/state/paginated-zero-list.svelte';
	import { encodeEventSignupListCursor } from '$lib/utils/event-signup/cursor';
	import { IsInViewport, watch } from 'runed';
	import { formatNumber } from '$lib/utils/number';

	const pageSize = 25;
	let sentinel: HTMLElement | null = $state(null);
	const sentinelIsInViewport = $derived(new IsInViewport(() => sentinel));

	let filter: ListEventSignupsInput = $state({
		...getListFilter(appState.organizationId),
		includeDeleted: true,
		includeIncomplete: true,
		/* svelte-ignore state_referenced_locally */
		eventId: params.eventId
	});

	const paginatedSignups = new PaginatedZeroList<
		ListEventSignupsInput,
		ReadEventSignupZeroWithPerson
	>({
		getBaseFilter: () => filter,
		encodeCursor: encodeSignupCursor,
		pageSize
	});

	const eventSignups = $derived.by(() => {
		return z.createQuery(queries.eventSignup.list(paginatedSignups.pageFilter));
	});

	const allSignups = $derived.by(() => {
		return z.createQuery(
			queries.event.signups({
				eventId: params.eventId,
				includeDeleted: true,
				includeIncomplete: true
			})
		);
	});

	watch(
		() => eventSignups.data,
		(data) => {
			paginatedSignups.handlePage(data as ReadEventSignupZeroWithPerson[] | undefined);
		}
	);

	watch(
		() =>
			[
				sentinelIsInViewport.current,
				paginatedSignups.hasMore,
				paginatedSignups.items.length
			] as const,
		([isInViewport, hasMore]) => {
			if (isInViewport && hasMore) {
				paginatedSignups.loadMore();
			}
		}
	);

	function encodeSignupCursor(signup: ReadEventSignupZeroWithPerson) {
		return encodeEventSignupListCursor({
			createdAt: signup.createdAt,
			id: signup.id
		});
	}

	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import { ElementSize } from 'runed';

	let tableContainer = $state() as HTMLElement;
	const size = new ElementSize(() => tableContainer);

	const event = $derived.by(() => {
		return z.createQuery(queries.event.read({ eventId: params.eventId }));
	});

	//@svelte-ignore state_referenced_locally
	watch(
		() => event,
		() => {
			if (event.data) {
				displayColumns = [
					...new Set([...defaultColumns, ...generateStartingColumns(event.data).person])
				];
				customColumns = [...new Set([...generateStartingColumns(event.data).custom])];
			}
		}
	);
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import Avatar from '$lib/components/widgets/avatar/Avatar.svelte';
	import RenderEventDetails from '$lib/components/layouts/app/sidebars/events/RenderEventDetails.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import DownloadIcon from '@lucide/svelte/icons/download';

	import type { SurveyQuestion } from '$lib/schema/survey/questions';
	import type { ReadEventZero } from '$lib/schema/event';
	import {
		generateStartingColumns,
		defaultColumns,
		renderPersonColumn,
		potentialColumns,
		renderColumnName
	} from './actions';
	let displayColumns = $state([...defaultColumns]);
	let customColumns = $state<SurveyQuestion[]>([]);

	import ConfigureColumns from './ConfigureColumns.svelte';
	function getCustomColumnLabelById(id: string) {
		return customColumns.find((column) => column.id === id)?.label;
	}

	function buildSignupTableRows(
		list: readonly ReadEventSignupZeroWithPerson[],
		headers: string[],
		personColumns: string[]
	) {
		const rows: Record<string, string | null | undefined>[] = [];
		for (const signup of list) {
			const row: Record<string, string | null | undefined> = {};
			for (const header of headers) {
				if (personColumns.includes(header)) {
					row[header] = renderPersonColumn({
						columnName: header,
						signup,
						locale: locale.current
					});
				} else {
					const customFieldValue = signup.details.customFields[header];
					let value = null;
					if (typeof customFieldValue === 'string') {
						value = customFieldValue;
					} else if (typeof customFieldValue === 'number') {
						value = customFieldValue.toString();
					} else if (typeof customFieldValue === 'boolean') {
						value = customFieldValue.toString();
					} else if (Array.isArray(customFieldValue)) {
						value = customFieldValue.join(', ');
					}
					row[header] = value;
				}
			}
			rows.push(row);
		}
		return rows;
	}

	const tableHeaders = $derived.by(() => [...displayColumns, ...customColumns.map((c) => c.id)]);

	const table = $derived.by(() =>
		buildSignupTableRows(paginatedSignups.items, tableHeaders, displayColumns)
	);

	const exportTable = $derived.by(() =>
		buildSignupTableRows(
			(allSignups.data ?? []) as ReadEventSignupZeroWithPerson[],
			tableHeaders,
			displayColumns
		)
	);

	const transformedTable = $derived.by(() => {
		return exportTable.map((row) => {
			const newRow: Record<string, any> = {};
			for (const key in row) {
				if (row.hasOwnProperty(key)) {
					const newKey =
						renderColumnName(key) === key ? getCustomColumnLabelById(key) : renderColumnName(key);
					if (newKey) {
						newRow[newKey] = row[key];
					}
				}
			}
			return newRow;
		});
	});

	const downloadCsvReady = $derived(
		allSignups.details.type === 'complete' && event.data && (allSignups.data?.length ?? 0) > 0
	);

	import Papa from 'papaparse';

	async function downloadTableAsCSV() {
		if (!downloadCsvReady) {
			return;
		}
		const csvString = Papa.unparse(transformedTable);
		const blob = new Blob([csvString], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${event.data?.slug}-signups.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<ContentLayout rootLink="/events/{params.eventId}" {header}>
	{#if eventSignups.details.type === 'unknown'}
		<Skeleton class="h-48 w-full" />
	{:else}
		<div class="space-y-4" data-testid="event-signups-detailed-list">
			{#if paginatedSignups.items.length > 0}
				<p class="text-muted-foreground">
					{t`${formatNumber(paginatedSignups.items.length, locale.current)} shown`}
				</p>
			{/if}
			<div class="w-full" bind:this={tableContainer}>
				{#if paginatedSignups.items.length > 0}
					<ScrollArea orientation="horizontal" class="h-auto w-96" style={`width: ${size.width}px`}>
						<Table.Root data-testid="event-signups-detailed-table">
							<Table.Header>
								<Table.Row>
									{#each tableHeaders as header (header)}
										<Table.Head
											>{getCustomColumnLabelById(header) ?? renderColumnName(header)}</Table.Head
										>
									{/each}
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each table as row, rowIndex (paginatedSignups.items[rowIndex]?.id ?? rowIndex)}
									<Table.Row>
										{#each tableHeaders as column (column)}
											<Table.Cell>{row[column] ?? ''}</Table.Cell>
										{/each}
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</ScrollArea>
					{#if paginatedSignups.hasMore}
						<div
							bind:this={sentinel}
							class="h-1"
							data-testid="event-signups-detailed-scroll-sentinel"
						></div>
					{/if}
				{/if}
			</div>
		</div>
	{/if}
</ContentLayout>

{#snippet header()}
	<div class="flex items-center justify-between">
		<div>
			{#if event.data && event.data.title}
				<div class="flex w-full items-center justify-start gap-3">
					<div class="w-12">
						<Avatar
							src={event.data.featureImage}
							name1={event.data.title}
							class="size-12 rounded-lg"
							imageClass="rounded-lg object-cover"
						/>
					</div>
					<div>
						<div class="text-lg font-medium">{event.data.title}</div>
						<RenderEventDetails event={event.data} />
					</div>
				</div>
			{:else}
				<Skeleton class="h-10 w-20 rounded-lg" />
			{/if}
		</div>
		<div class="flex items-center gap-2">
			{#if event.data}
				<ConfigureColumns
					bind:person={displayColumns}
					bind:custom={customColumns}
					event={event.data}
				/>
			{/if}
			<Button
				variant="outline"
				size="sm"
				disabled={!downloadCsvReady}
				data-testid="event-signups-download-csv"
				onclick={downloadTableAsCSV}><DownloadIcon /> {t`Download CSV`}</Button
			>
		</div>
	</div>
{/snippet}

{#snippet renderColumn(
	column: (typeof potentialColumns)[number],
	signup: ReadEventSignupZeroWithPerson,
	event: ReadEventZero
)}
	{#if column === 'person.givenName'}
		{signup.person.givenName}
	{:else if column === 'person.familyName'}
		{signup.person.familyName}
	{:else if column === 'person.email'}
		{signup.person.emailAddress}
	{:else if column === 'person.phone'}
		{signup.person.phoneNumber}
	{:else if column === 'person.dateOfBirth'}
		{signup.person.dateOfBirth}
	{:else if column === 'person.gender'}
		{signup.person.gender}
	{:else if column === 'person.position'}
		{signup.person.position}
	{:else if column === 'person.workplace'}
		{signup.person.workplace}
	{:else if column === 'person.region'}
		{signup.person.region}
	{:else if column === 'person.postcode'}
		{signup.person.postcode}
	{:else if column === 'person.country'}
		{signup.person.country}
	{:else if column === 'person.createdAt'}
		{new Date(signup.person.createdAt).toLocaleDateString()}
	{:else if column === 'signup.status'}
		{signup.status}
	{:else if column === 'signup.notificationSentAt'}
		{#if signup.signupNotificationSentAt}{new Date(
				signup.signupNotificationSentAt
			).toLocaleDateString()}{/if}
	{:else if column === 'signup.reminderSentAt'}
		{#if signup.reminderSentAt}{new Date(signup.reminderSentAt).toLocaleDateString()}{/if}
	{:else if column === 'signup.cancellationNotificationSentAt'}
		{#if signup.cancellationNotificationSentAt}{new Date(
				signup.cancellationNotificationSentAt
			).toLocaleDateString()}{/if}
	{:else if column === 'signup.createdAt'}
		{new Date(signup.createdAt).toLocaleDateString()}
	{/if}
{/snippet}
