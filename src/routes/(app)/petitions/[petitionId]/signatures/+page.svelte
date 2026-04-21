<script lang="ts">
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import { t, locale } from '$lib/index.svelte';

	const { params } = $props();

	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';

	const petition = $derived.by(() => {
		return z.createQuery(queries.petition.read({ petitionId: params.petitionId }));
	});

	const signatures = $derived.by(() => {
		return z.createQuery(queries.petition.signatures({ petitionId: params.petitionId }));
	});

	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import { ElementSize } from 'runed';
	import { watch } from 'runed';

	let tableContainer = $state() as HTMLElement;
	const size = new ElementSize(() => tableContainer);

	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import PetitionListItem from '../PetitionListItem.svelte';
	import AddPersonModal from '$lib/components/widgets/person/add_modal/AddPersonModal.svelte';
	import { handleAddPerson } from '$lib/components/widgets/petition/signatures/signatureActions';
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
		const list = signatures.data ?? [];
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
	const downloadCsvReady = $derived(signatures.details.type === 'complete' && petition.data);
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
	{#if signatures.details.type === 'complete'}
		<div class="space-y-4">
			<p class="text-muted-foreground">
				Total signatures: {signatures.data?.length ?? 0}
			</p>
			{#if petition.data}
				{#if (signatures.data?.length ?? 0) === 0}
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
					<div class="w-full" bind:this={tableContainer}>
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
									{#each table as row, rowIndex (signatures.data?.[rowIndex]?.id ?? rowIndex)}
										<Table.Row>
											{#each tableHeaders as column (column)}
												<Table.Cell>{row[column] ?? ''}</Table.Cell>
											{/each}
										</Table.Row>
									{/each}
								</Table.Body>
							</Table.Root>
						</ScrollArea>
					</div>
				{/if}
			{/if}
		</div>
	{:else}
		<Skeleton class="h-48 w-full" />
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
					onclick={downloadTableAsCSV}><DownloadIcon /> {t`Download CSV`}</Button
				>
				<AddPersonModal
					trigger={addPersonTrigger}
					personIdsToExclude={[]}
					actionText={t`Add signature`}
					onSelected={(personIds) => {
						handleAddPerson({ petitionId: params.petitionId, personIds });
					}}
				/>
			{/if}
		</div>
	</div>
{/snippet}

{#snippet addPersonTrigger()}<Button><UserPlusIcon strokeWidth={2.5} /> {t`Add signature`}</Button
	>{/snippet}
