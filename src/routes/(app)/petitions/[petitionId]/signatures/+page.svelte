<script lang="ts">
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import { t, locale } from '$lib/index.svelte';

	const { params } = $props();

	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';
	import { appState, getListFilter } from '$lib/state.svelte';
	import type { PetitionSignatureListFilter } from '$lib/zero/query/petition_signature/list';
	import { PaginatedZeroList } from '$lib/state/paginated-zero-list.svelte';
	import { encodePetitionSignatureListCursor } from '$lib/utils/petition-signature/cursor';
	import { IsInViewport, watch } from 'runed';
	import { formatNumber } from '$lib/utils/number';

	const pageSize = 25;
	let sentinel: HTMLElement | null = $state(null);
	const sentinelIsInViewport = $derived(new IsInViewport(() => sentinel));

	let filter: PetitionSignatureListFilter = $state({
		...getListFilter(appState.organizationId),
		/* svelte-ignore state_referenced_locally */
		petitionId: params.petitionId
	});

	const paginatedSignatures = new PaginatedZeroList<
		PetitionSignatureListFilter,
		ReadPetitionSignatureZeroWithPerson
	>({
		getBaseFilter: () => filter,
		encodeCursor: encodeSignatureCursor,
		pageSize
	});
	setPetitionSignaturesListPaginationContext({
		reset: () => paginatedSignatures.reset()
	});

	const petition = $derived.by(() => {
		return z.createQuery(queries.petition.read({ petitionId: params.petitionId }));
	});

	const petitionSignatures = $derived.by(() => {
		return z.createQuery(queries.petitionSignature.list(paginatedSignatures.pageFilter));
	});

	watch(
		() => petitionSignatures.data,
		(data) => {
			paginatedSignatures.handlePage(data);
		}
	);

	watch(
		() =>
			[
				sentinelIsInViewport.current,
				paginatedSignatures.hasMore,
				paginatedSignatures.items.length
			] as const,
		([isInViewport, hasMore]) => {
			if (isInViewport && hasMore) {
				paginatedSignatures.loadMore();
			}
		}
	);

	function encodeSignatureCursor(signature: ReadPetitionSignatureZeroWithPerson) {
		return encodePetitionSignatureListCursor({
			createdAt: signature.createdAt,
			id: signature.id
		});
	}

	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import { ElementSize } from 'runed';

	let tableContainer = $state() as HTMLElement;
	const size = new ElementSize(() => tableContainer);

	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import PetitionListItem from '../PetitionListItem.svelte';
	import AddPersonModal from '$lib/components/widgets/person/add_modal/AddPersonModal.svelte';
	import { handleAddPerson } from '$lib/components/widgets/petition/signatures/signatureActions';
	import {
		resetPetitionSignaturesListPagination,
		setPetitionSignaturesListPaginationContext
	} from '$lib/components/widgets/petition/signatures/petition-signatures-list-pagination';
	import UserPlusIcon from '@lucide/svelte/icons/user-plus';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import PenLineIcon from '@lucide/svelte/icons/pen-line';

	import ConfigureColumns from './ConfigureColumns.svelte';
	import {
		defaultColumns,
		generateStartingColumns,
		renderSignatureColumn,
		renderColumnName,
		formatSurveyResponseValue,
		getSignatureResponsesField
	} from './actions';
	import type { ReadPetitionSignatureZeroWithPerson } from '$lib/schema/petition/petition-signature';
	import type { SurveyQuestion } from '$lib/schema/survey/questions';

	import Papa from 'papaparse';

	let displayColumns = $state<string[]>([...defaultColumns]);
	let customColumns = $state<SurveyQuestion[]>([]);

	//@svelte-ignore state_referenced_locally
	watch(
		() => petition.data,
		() => {
			if (petition.data) {
				displayColumns = [
					...new Set([...defaultColumns, ...generateStartingColumns(petition.data).person])
				];
				customColumns = [...new Set([...generateStartingColumns(petition.data).custom])];
			}
		}
	);

	const tableHeaders = $derived.by(() => [...displayColumns, ...customColumns.map((c) => c.id)]);

	function getCustomColumnLabelById(id: string) {
		return customColumns.find((column) => column.id === id)?.label;
	}

	const table = $derived.by(() => {
		const list = paginatedSignatures.items;
		const rows: Record<string, string | null | undefined>[] = [];
		for (const signature of list) {
			const row: Record<string, string | null | undefined> = {};
			const sig = signature as ReadPetitionSignatureZeroWithPerson;
			for (const header of tableHeaders) {
				if (displayColumns.includes(header)) {
					row[header] = renderSignatureColumn({
						columnName: header,
						signature: sig,
						locale: locale.current
					});
				} else {
					row[header] = formatSurveyResponseValue(getSignatureResponsesField(sig, header));
				}
			}
			rows.push(row);
		}
		return rows;
	});

	const transformedTable = $derived.by(() => {
		const headers = tableHeaders;
		const used = new Set<string>();
		const exportKeys: string[] = [];
		for (const header of headers) {
			const baseLabel = getCustomColumnLabelById(header) ?? renderColumnName(header);
			let exportKey = baseLabel || header;
			if (used.has(exportKey)) {
				exportKey = `${baseLabel || header} (${header})`;
			}
			let n = 2;
			while (used.has(exportKey)) {
				exportKey = `${baseLabel || header} (${header}) (${n})`;
				n++;
			}
			used.add(exportKey);
			exportKeys.push(exportKey);
		}
		return table.map((row) => {
			const newRow: Record<string, string | null | undefined> = {};
			for (let i = 0; i < headers.length; i++) {
				newRow[exportKeys[i]] = row[headers[i]];
			}
			return newRow;
		});
	});
	const downloadCsvReady = $derived(
		petitionSignatures.details.type === 'complete' &&
			petition.data &&
			paginatedSignatures.items.length > 0
	);
	async function downloadTableAsCSV() {
		if (!downloadCsvReady) {
			return;
		}
		const csvString = Papa.unparse(transformedTable);
		const blob = new Blob([csvString], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${petition.data?.slug}-signatures.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<ContentLayout rootLink="/petitions/{params.petitionId}" {header}>
	{#if petitionSignatures.details.type === 'unknown'}
		<Skeleton class="h-48 w-full" />
	{:else}
		<div class="space-y-4" data-testid="petition-signatures-detailed-list">
			{#if paginatedSignatures.items.length > 0}
				<p class="text-muted-foreground">
					{t`${formatNumber(paginatedSignatures.items.length, locale.current)} shown`}
				</p>
			{/if}
			{#if petition.data}
				{#if paginatedSignatures.items.length === 0}
					<Empty.Root>
						<Empty.Header>
							<Empty.Media variant="icon">
								<PenLineIcon />
							</Empty.Media>
							<Empty.Title>{t`No signatures found`}</Empty.Title>
							<Empty.Description
								>{t`No signatures found for this petition. Signatures will appear here once people sign.`}</Empty.Description
							>
						</Empty.Header>
					</Empty.Root>
				{:else}
					<div
						class="w-full"
						bind:this={tableContainer}
						data-testid="petition-signatures-detailed-table"
					>
						<ScrollArea
							orientation="horizontal"
							class="h-auto w-96"
							style={`width: ${size.width}px`}
						>
							<Table.Root>
								<Table.Header>
									<Table.Row>
										{#each tableHeaders as column (column)}
											<Table.Head
												>{getCustomColumnLabelById(column) ?? renderColumnName(column)}</Table.Head
											>
										{/each}
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{#each table as row, rowIndex (paginatedSignatures.items[rowIndex]?.id ?? rowIndex)}
										<Table.Row data-testid="petition-signature-detailed-item">
											{#each tableHeaders as column (column)}
												<Table.Cell>{row[column] ?? ''}</Table.Cell>
											{/each}
										</Table.Row>
									{/each}
								</Table.Body>
							</Table.Root>
						</ScrollArea>
					</div>
					{#if paginatedSignatures.hasMore}
						<div
							bind:this={sentinel}
							class="h-1"
							data-testid="petition-signatures-detailed-scroll-sentinel"
						></div>
					{/if}
				{/if}
			{/if}
		</div>
	{/if}
</ContentLayout>

{#snippet header()}
	<div class="flex items-center justify-between">
		<div>
			{#if petition.data && petition.data.title}
				<PetitionListItem petition={petition.data} />
				<span class="ml-2 text-muted-foreground">- Signatures</span>
			{:else}
				<Skeleton class="h-10 w-32 rounded-lg" />
			{/if}
		</div>
		<div class="flex items-center gap-2">
			{#if petition.data}
				<ConfigureColumns
					bind:person={displayColumns}
					bind:custom={customColumns}
					petition={petition.data}
				/>
				<Button
					variant="outline"
					size="sm"
					disabled={!downloadCsvReady}
					data-testid="petition-signatures-download-csv"
					onclick={downloadTableAsCSV}><DownloadIcon /> {t`Download CSV`}</Button
				>
				<AddPersonModal
					trigger={addPersonTrigger}
					personIdsToExclude={[]}
					actionText={t`Add signature`}
					onSelected={(personIds) => {
						handleAddPerson({ petitionId: params.petitionId, personIds });
						resetPetitionSignaturesListPagination();
					}}
				/>
			{/if}
		</div>
	</div>
{/snippet}

{#snippet addPersonTrigger()}<Button data-testid="petition-signatures-add-signature"
		><UserPlusIcon strokeWidth={2.5} /> {t`Add signature`}</Button
	>{/snippet}
