<script lang="ts">
	import { t } from '$lib/index.svelte';
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import { z } from '$lib/zero.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import { getListFilter, appState } from '$lib/state.svelte';
	import queries from '$lib/zero/query/index';
	import ResponsiveModal from '$lib/components/ui/responsive-modal/responsive-modal.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import H2 from '$lib/components/ui/typography/H2.svelte';
	import { Label } from '$lib/components/ui/label/index.js';
	import { v4 as uuidv4 } from 'uuid';
	import { toast } from 'svelte-sonner';
	import UploadIcon from '@lucide/svelte/icons/upload';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import { formatDate } from '$lib/utils/date';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { downloadSampleCsv } from '$lib/utils/csv';
	import { env } from '$env/dynamic/public';

	const { PUBLIC_AWS_S3_SITE_UPLOADS_BUCKET_NAME } = env;

	let personImportListFilter = $state({
		...getListFilter(appState.organizationId)
	});
	const personImportsQuery = $derived.by(() =>
		z.createQuery(queries.personImport.list(personImportListFilter))
	);

	const imports = $derived.by(() => {
		if (!personImportsQuery.data) return [];
		return personImportsQuery.data
			.map((imp) => ({
				id: imp.id,
				createdAt: imp.createdAt,
				status: imp.status,
				importedBy: imp.importedByPerson?.name || 'Unknown',
				totalRows: imp.totalRows,
				processedRows: imp.processedRows,
				failedRows: imp.failedRows,
				failedEntries: imp.failedEntries as
					| { row: number; error: string; data?: any }[]
					| null
					| undefined
			}))
			.sort((a, b) => b.createdAt - a.createdAt);
	});

	let uploadModalOpen = $state(false);
	let selectedFile: File | null = $state(null);
	let failuresModalOpen = $state(false);
	let selectedImportFailures: { row: number; error: string; data?: any }[] | null = $state(null);
	let uploading = $state(false);

	async function getUploadUrl(fileKey: string) {
		const result = await fetch(`/api/utils/upload?key=${fileKey}`).then((res) => res.json());
		return result.signedUrl;
	}

	function createFileKey(file: File) {
		return `organization/${appState.organizationId}/people-imports/${uuidv4()}.csv`;
	}

	async function uploadToS3(file: File, signedUrl: string) {
		const response = await fetch(signedUrl, {
			method: 'PUT',
			headers: {
				'Content-Type': file.type
			},
			body: file
		});
		if (!response.ok) {
			throw new Error(`Failed to upload file: ${response.statusText}`);
		}
		const uploadedFilePath = new URL(response.url).pathname;
		return uploadedFilePath;
	}

	async function handleUpload() {
		if (!selectedFile) {
			toast.error(t`Please select a CSV file`);
			return;
		}

		try {
			uploading = true;

			const fileKey = createFileKey(selectedFile);
			const signedUrl = await getUploadUrl(fileKey);
			const uploadedFilePath = await uploadToS3(selectedFile, signedUrl);
			const csvUrl = `https://${PUBLIC_AWS_S3_SITE_UPLOADS_BUCKET_NAME}.s3.amazonaws.com${uploadedFilePath}`;

			const importId = uuidv4();

			await z.mutate(
				mutators.personImport.insert({
					metadata: {
						organizationId: appState.organizationId,
						importId,
						importedBy: appState.userId
					},
					input: {
						csvUrl
					}
				})
			);

			await z.mutate(
				mutators.personImport.triggerQueue({
					metadata: {
						organizationId: appState.organizationId,
						importId,
						importedBy: appState.userId
					}
				})
			);

			toast.success(t`Import started successfully`);
			uploadModalOpen = false;
			selectedFile = null;
		} catch (error) {
			console.error('Upload failed:', error);
			toast.error(error instanceof Error ? error.message : t`Upload failed. Please try again.`);
		} finally {
			uploading = false;
		}
	}

	function getStatusBadgeVariant(
		status: string
	): 'default' | 'secondary' | 'destructive' | 'outline' {
		switch (status) {
			case 'completed':
				return 'default';
			case 'processing':
				return 'secondary';
			case 'failed':
				return 'destructive';
			default:
				return 'outline';
		}
	}

	function getStatusLabel(status: string): string {
		switch (status) {
			case 'completed':
				return t`Completed`;
			case 'processing':
				return t`Processing`;
			case 'failed':
				return t`Failed`;
			case 'pending':
				return t`Pending`;
			default:
				return status;
		}
	}
</script>

<ContentLayout rootLink="/settings" {header}>
	<div class="space-y-4">
		{#if imports.length === 0}
			<div class="flex flex-col items-center justify-center py-12 text-center">
				<p class="mb-4 text-muted-foreground">{t`No imports yet`}</p>
				{#if appState.isAdminOrOwner}
					<Button onclick={() => (uploadModalOpen = true)}>{t`New Import`}</Button>
				{/if}
			</div>
		{:else}
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>{t`Date`}</Table.Head>
						<Table.Head>{t`Status`}</Table.Head>
						<Table.Head>{t`Imported by`}</Table.Head>
						<Table.Head>{t`Details`}</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each imports as imp (imp.id)}
						<Table.Row>
							<Table.Cell>{formatDate(imp.createdAt)}</Table.Cell>
							<Table.Cell>
								<Badge variant={getStatusBadgeVariant(imp.status)}>
									{getStatusLabel(imp.status)}
								</Badge>
							</Table.Cell>
							<Table.Cell>{imp.importedBy}</Table.Cell>
							<Table.Cell>
								{#if imp.status === 'completed' || imp.status === 'failed'}
									<div class="flex items-center gap-2">
										<span class="text-sm text-muted-foreground">
											{imp.processedRows || 0}
											{t`imported`}
											{#if (imp.failedRows || 0) > 0}
												, {imp.failedRows} {t`failed`}
											{/if}
										</span>
										{#if (imp.failedRows || 0) > 0 && imp.failedEntries}
											<Button
												variant="outline"
												size="sm"
												onclick={() => {
													selectedImportFailures = imp.failedEntries ?? null;
													failuresModalOpen = true;
												}}
											>
												{t`View Failures`}
											</Button>
										{/if}
									</div>
								{:else}
									<span class="text-sm text-muted-foreground">-</span>
								{/if}
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		{/if}
	</div>
</ContentLayout>

{#snippet header()}
	<div class="flex items-center justify-between">
		<H2>{t`People Imports`}</H2>
		{#if appState.isAdminOrOwner}
			<ResponsiveModal
				title={t`New People Import`}
				description={t`Upload a CSV file to import people`}
				bind:open={uploadModalOpen}
			>
				{#snippet trigger()}
					<Button>{t`New Import`}</Button>
				{/snippet}
				{#snippet children()}
					<div class="space-y-4">
						<div class="space-y-2">
							<div class="flex items-center justify-between">
								<Label for="csvFile">{t`CSV file`}</Label>
								<button
									type="button"
									class="flex items-center gap-1 text-sm text-primary underline hover:no-underline"
									onclick={() => downloadSampleCsv()}
								>
									<DownloadIcon class="size-3" />
									{t`Download sample`}
								</button>
							</div>
							<input
								id="csvFile"
								type="file"
								accept=".csv,text/csv"
								class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
								onchange={(e: Event) => {
									const input = e.target as HTMLInputElement;
									selectedFile = input.files?.[0] ?? null;
								}}
							/>
							{#if selectedFile}
								<p class="text-xs text-muted-foreground">{t`Selected:`} {selectedFile.name}</p>
							{/if}
						</div>
					</div>
				{/snippet}
				{#snippet footer()}
					<div class="flex justify-end gap-2">
						<Button
							variant="outline"
							onclick={() => (uploadModalOpen = false)}
							disabled={uploading}
						>
							{t`Cancel`}
						</Button>
						<Button onclick={handleUpload} disabled={uploading}>
							{#if uploading}
								<UploadIcon class="mr-2 size-4 animate-spin" />
								{t`Uploading...`}
							{:else}
								<UploadIcon class="mr-2 size-4" />
								{t`Upload`}
							{/if}
						</Button>
					</div>
				{/snippet}
			</ResponsiveModal>

			<ResponsiveModal
				title={t`Import Failures`}
				description={t`Detailed information about failed import entries`}
				bind:open={failuresModalOpen}
			>
				{#snippet children()}
					<div class="max-h-[60vh] space-y-4 overflow-y-auto">
						{#if selectedImportFailures && selectedImportFailures.length > 0}
							{#each selectedImportFailures as failure (failure.row)}
								<div class="space-y-2 rounded-lg border p-4">
									<div class="flex items-center gap-2">
										<Badge variant="destructive">{t`Row`} {failure.row}</Badge>
										<span class="text-sm font-medium text-destructive">{failure.error}</span>
									</div>
									{#if failure.data}
										<div class="text-xs text-muted-foreground">
											<div class="mb-1 font-semibold">{t`Row Data:`}</div>
											<pre class="overflow-x-auto rounded bg-muted p-2">{JSON.stringify(
													failure.data,
													null,
													2
												)}</pre>
										</div>
									{/if}
								</div>
							{/each}
						{:else}
							<p class="py-8 text-center text-muted-foreground">
								{t`No failure details available`}
							</p>
						{/if}
					</div>
				{/snippet}
				{#snippet footer()}
					<Button variant="outline" onclick={() => (failuresModalOpen = false)}>{t`Close`}</Button>
				{/snippet}
			</ResponsiveModal>
		{/if}
	</div>
{/snippet}
