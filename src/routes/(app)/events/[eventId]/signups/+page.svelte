<script lang="ts">
	import { t } from '$lib/index.svelte';
	const { params } = $props();
	import { appState, getListFilter } from '$lib/state.svelte';
	import { listEventSignups, type ListEventSignupsInput } from '$lib/zero/query/event_signup/list';
	import { type ReadEventSignupZeroWithPerson } from '$lib/schema/event-signup';
	import { z } from '$lib/zero.svelte';
	let filter: ListEventSignupsInput = $state({
		...getListFilter(appState.organizationId),
		eventId: params.eventId
	});
	const eventSignups = $derived.by(() => {
		return z.createQuery(listEventSignups(appState.queryContext, filter));
	});
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import { readEvent } from '$lib/zero/query/event/read';
	import { ElementSize } from 'runed';

	let tableContainer = $state() as HTMLElement;
	const size = new ElementSize(() => tableContainer);
	import { watch } from 'runed';

	const event = $derived.by(() => {
		return z.createQuery(readEvent(appState.queryContext, { eventId: params.eventId }));
	});

	//@svelte-ignore state_referenced_locally
	watch(
		() => event,
		() => {
			if (event.data && event.data.settings.survey.collections[0].questions) {
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

	const table = $derived.by(() => {
		//this is going to be quite a long one w...
		// first up, we need to get the currently active columns, with proper rendering...
		const headers = [...displayColumns, ...customColumns.map((column) => column.id)];
		let obj: { [key: (typeof headers)[number]]: string | null | undefined }[] = [];
		for (const signup of eventSignups.data) {
			let row: { [key: (typeof headers)[number]]: string | null | undefined } = {};
			for (const header of headers) {
				if (displayColumns.includes(header)) {
					row[header] = renderPersonColumn({
						columnName: header,
						signup: signup as ReadEventSignupZeroWithPerson,
						locale: appState.locale
					});
				} else {
					const typedSignup: ReadEventSignupZeroWithPerson =
						signup as ReadEventSignupZeroWithPerson; //just to get type safety
					const customFieldValue = typedSignup.details.customFields[header];
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
			obj.push(row);
		}
		return obj;
	});

	const transformedTable = $derived.by(() => {
		return table.map((row) => {
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
	import Papa from 'papaparse';

	async function downloadTableAsCSV() {
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
	<div class="w-full" bind:this={tableContainer}>
		<ScrollArea orientation="horizontal" class="h-auto w-96" style={`width: ${size.width}px`}>
			{#if transformedTable}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							{#each Object.keys(transformedTable[0] || {}) as header}
								<Table.Head>
									{header}
								</Table.Head>
							{/each}
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each table as row}
							<Table.Row>
								{#each Object.keys(row) as header}
									<Table.Cell>{row[header]}</Table.Cell>
								{/each}
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			{/if}
		</ScrollArea>
	</div>
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
			<Button variant="outline" size="sm" onclick={downloadTableAsCSV}
				><DownloadIcon /> {t`Download CSV`}</Button
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
	{:else if column === 'person.socialMedia'}
		{signup.person.socialMedia}
	{:else if column === 'person.mostRecentActivityAt'}
		{signup.person.mostRecentActivityAt}
	{:else if column === 'person.mostRecentActivityPreview'}
		{signup.person.mostRecentActivityPreview}
	{:else if column === 'person.profilePicture'}
		{signup.person.profilePicture}
	{:else if column === 'person.addedFrom'}
		{signup.person.addedFrom}
	{:else if column === 'person.preferredLanguage'}
		{signup.person.preferredLanguage}
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
