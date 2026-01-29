<script lang="ts">
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import { z } from '$lib/zero.svelte';
	import { getListFilter, appState } from '$lib/state.svelte';
	import { listPersonImports } from '$lib/zero/query/person_import/list';
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
		z.createQuery(listPersonImports(appState.queryContext, personImportListFilter))
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
			toast.error('Please select a CSV file');
			return;
		}

		try {
			uploading = true;

			const fileKey = createFileKey(selectedFile);
			const signedUrl = await getUploadUrl(fileKey);
			const uploadedFilePath = await uploadToS3(selectedFile, signedUrl);
			const csvUrl = `https://${PUBLIC_AWS_S3_SITE_UPLOADS_BUCKET_NAME}.s3.amazonaws.com${uploadedFilePath}`;

			const importId = uuidv4();

			await z.mutate.personImport.insert({
				metadata: {
					organizationId: appState.organizationId,
					importId,
					importedBy: appState.userId
				},
				input: {
					csvUrl
				}
			});

			await z.mutate.personImport.triggerQueue({
				personImportId: importId,
				organizationId: appState.organizationId
			});

			toast.success('Import started successfully');
			uploadModalOpen = false;
			selectedFile = null;
		} catch (error) {
			console.error('Upload failed:', error);
			toast.error(error instanceof Error ? error.message : 'Upload failed. Please try again.');
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
				return 'Completed';
			case 'processing':
				return 'Processing';
			case 'failed':
				return 'Failed';
			case 'pending':
				return 'Pending';
			default:
				return status;
		}
	}
</script>

<ContentLayout rootLink="/settings" {header}>
	<div class="space-y-4">
		{#if imports.length === 0}
			<div class="flex flex-col items-center justify-center py-12 text-center">
				<p class="text-muted-foreground mb-4">No imports yet</p>
				{#if appState.isAdminOrOwner}
					<Button onclick={() => (uploadModalOpen = true)}>New Import</Button>
				{/if}
			</div>
		{:else}
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Date</Table.Head>
						<Table.Head>Status</Table.Head>
						<Table.Head>Imported by</Table.Head>
						<Table.Head>Details</Table.Head>
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
									<span class="text-sm text-muted-foreground">
										{imp.processedRows || 0} imported
										{#if (imp.failedRows || 0) > 0}
											, {imp.failedRows} failed
										{/if}
									</span>
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
		<H2>People Imports</H2>
		{#if appState.isAdminOrOwner}
			<ResponsiveModal
				title="New People Import"
				description="Upload a CSV file to import people"
				bind:open={uploadModalOpen}
			>
				{#snippet trigger()}
					<Button>New Import</Button>
				{/snippet}
				{#snippet children()}
					<div class="space-y-4">
						<div class="space-y-2">
							<div class="flex items-center justify-between">
								<Label for="csvFile">CSV file</Label>
								<button
									type="button"
									class="text-sm text-primary underline hover:no-underline flex items-center gap-1"
									onclick={() => downloadSampleCsv()}
								>
									<DownloadIcon class="size-3" />
									Download sample
								</button>
							</div>
							<input
								id="csvFile"
								type="file"
								accept=".csv,text/csv"
								class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
								onchange={(e: Event) => {
									const input = e.target as HTMLInputElement;
									selectedFile = input.files?.[0] ?? null;
								}}
							/>
							{#if selectedFile}
								<p class="text-xs text-muted-foreground">Selected: {selectedFile.name}</p>
							{/if}
						</div>
					</div>
				{/snippet}
				{#snippet footer()}
					<div class="flex justify-end gap-2">
						<Button variant="outline" onclick={() => (uploadModalOpen = false)} disabled={uploading}>
							Cancel
						</Button>
						<Button onclick={handleUpload} disabled={uploading}>
							{#if uploading}
								<UploadIcon class="mr-2 size-4 animate-spin" />
								Uploading...
							{:else}
								<UploadIcon class="mr-2 size-4" />
								Upload
							{/if}
						</Button>
					</div>
				{/snippet}
			</ResponsiveModal>
		{/if}
	</div>
{/snippet}
