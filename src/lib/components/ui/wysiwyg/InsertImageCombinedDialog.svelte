<script lang="ts">
	import { getActiveEditor, ModalDialog, CloseCircleButton, InsertImage } from 'svelte-lexical';
	import { tick } from 'svelte';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { processAndUploadFile } from '$lib/components/ui/image-upload/upload_utils.js';

	const activeEditor = getActiveEditor();

	let { showModal = $bindable(false) } = $props();
	let altText = $state('');
	let imageUrl = $state('');
	let uploadedImageUrl = $state('');
	let activeTab = $state('url');
	let isUploading = $state(false);
	let selectedFile: File | null = $state(null);

	export function open() {
		showModal = true;
		altText = '';
		imageUrl = '';
		uploadedImageUrl = '';
		selectedFile = null;
		isUploading = false;
	}

	async function close() {
		showModal = false;
		await tick();
	}

	function onFileSelected(files: FileList | null) {
		if (!files || files.length === 0) return;
		selectedFile = files[0];
	}

	async function uploadAndInsert() {
		if (!selectedFile) return;
		isUploading = true;
		try {
			uploadedImageUrl = await processAndUploadFile(selectedFile);
			InsertImage($activeEditor, { altText, src: uploadedImageUrl });
			close();
		} catch (err) {
			console.error('Upload failed:', err);
		} finally {
			isUploading = false;
		}
	}

	function insertUrlImage() {
		if (!imageUrl) return;
		InsertImage($activeEditor, { altText, src: imageUrl });
		close();
	}
</script>

<ModalDialog bind:showModal>
	<div class="w-[400px] p-4">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-lg font-semibold">Insert Image</h2>
			<CloseCircleButton on:click={close} />
		</div>

		<Tabs.Root bind:value={activeTab} class="w-full">
			<Tabs.List class="grid w-full grid-cols-2">
				<Tabs.Trigger value="url">URL</Tabs.Trigger>
				<Tabs.Trigger value="upload">Upload</Tabs.Trigger>
			</Tabs.List>

			<Tabs.Content value="url" class="space-y-4">
				<div class="space-y-2">
					<Label for="image-url">Image URL</Label>
					<Input
						id="image-url"
						type="url"
						placeholder="https://example.com/image.jpg"
						bind:value={imageUrl}
					/>
				</div>
				<div class="space-y-2">
					<Label for="url-alt-text">Alt Text</Label>
					<Input
						id="url-alt-text"
						placeholder="Descriptive text for the image"
						bind:value={altText}
					/>
				</div>
				<Button class="w-full" disabled={!imageUrl} onclick={insertUrlImage}>
					Insert Image
				</Button>
			</Tabs.Content>

			<Tabs.Content value="upload" class="space-y-4">
				<div class="space-y-2">
					<Label for="image-upload">Upload Image</Label>
					<Input
						id="image-upload"
						type="file"
						accept="image/*"
						onchange={(e) => onFileSelected(e.currentTarget.files)}
						disabled={isUploading}
					/>
				</div>
				<div class="space-y-2">
					<Label for="upload-alt-text">Alt Text</Label>
					<Input
						id="upload-alt-text"
						placeholder="Descriptive text for the image"
						bind:value={altText}
						disabled={isUploading}
					/>
				</div>
				<Button
					class="w-full"
					disabled={!selectedFile || isUploading}
					onclick={uploadAndInsert}
				>
					{#if isUploading}
						Uploading...
					{:else}
						Insert Image
					{/if}
				</Button>
			</Tabs.Content>
		</Tabs.Root>
	</div>
</ModalDialog>
