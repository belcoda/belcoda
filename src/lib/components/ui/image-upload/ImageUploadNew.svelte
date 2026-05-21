<script lang="ts" module>
	import UploadIcon from '@lucide/svelte/icons/upload';
	import LoaderIcon from '@lucide/svelte/icons/loader';
	import BadgeXIcon from '@lucide/svelte/icons/badge-x';
	import RefreshCCWIcon from '@lucide/svelte/icons/refresh-ccw';
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import ResponsiveModal from '$lib/components/ui/responsive-modal/responsive-modal.svelte';
	import { FileUpload } from 'melt/builders';
	import { cn } from '$lib/utils.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import Cropper from 'svelte-easy-crop';
	import { t } from '$lib/index.svelte';
	import {
		createCroppedFile,
		processAndUploadFile,
		loadImageToElement,
		resizeImageFile
	} from '$lib/components/ui/image-upload/upload_utils';

	type CropResults = { x: number; y: number; width: number; height: number };
	type CropConfig = { aspectRatio?: number };

	type FileUploadTriggerProps = {
		readonly 'data-disabled': '' | undefined;
		readonly onclick: () => void;
	};

	type TriggerSnippetArgs = {
		triggerProps: FileUploadTriggerProps;
		loading: boolean;
		fileUrl: string | null | undefined;
		errorState: string | null;
	};

	type PreviewSnippetArgs = {
		fileUrl: string | null | undefined;
		loading: boolean;
		errorState: string | null;
	};

	type Props = {
		fileUrl?: string | null | undefined;
		class?: string;
		onUpload?: (url: string) => Promise<void> | void;
		crop?: boolean | CropConfig;
		aspectRatio?: number;
		maxDimension?: number;
		maxSize?: number;
		accept?: string;
		disabled?: boolean;
		showDropzone?: boolean;
		trigger?: Snippet<[TriggerSnippetArgs]>;
		preview?: Snippet<[PreviewSnippetArgs]>;
	};

	let {
		fileUrl = undefined,
		class: className,
		onUpload = async () => {},
		crop = undefined,
		aspectRatio: aspectRatioProp = 16 / 9,
		maxDimension = 2048,
		maxSize: maxSizeProp,
		accept = '.png, .jpg, .jpeg',
		disabled = false,
		showDropzone: showDropzoneProp,
		trigger,
		preview
	}: Props = $props();

	const cropEnabled = $derived(crop === true || (typeof crop === 'object' && crop !== null));
	const resolvedAspectRatio = $derived(
		typeof crop === 'object' && crop?.aspectRatio != null ? crop.aspectRatio : aspectRatioProp
	);
	const effectiveMaxSize = $derived(
		maxSizeProp ?? (cropEnabled ? 2 * 1024 * 1024 : 10 * 1024 * 1024)
	);
	const humanReadableMaxFileSize = $derived(effectiveMaxSize >= 10 * 1024 * 1024 ? '10MB' : '2MB');
	const showDropzone = $derived(showDropzoneProp ?? !trigger);

	let loading = $state(false);
	let modalOpen = $state(false);
	let errorState: string | null = $state(null);
	let oldFileUrl = $state<string | null | undefined>(undefined);
	let inProgressFileUrl = $state<string | null | undefined>(undefined);

	let imageElement = $state<HTMLImageElement | undefined>(undefined);

	let cropPosition = $state({ x: 0, y: 0 });
	let zoom = $state(1);
	let cropResults = $state<CropResults | null>(null);

	function revokeBlobUrl(url: string | null | undefined) {
		if (url?.startsWith('blob:')) {
			URL.revokeObjectURL(url);
		}
	}

	function setFileError(err: {
		type: 'size' | 'type' | 'validation' | 'upload' | 'custom';
		message: string;
	}) {
		if (err.type === 'size') {
			errorState = t`File too large. Max size is ${humanReadableMaxFileSize}.`;
		} else if (err.type === 'type') {
			errorState = t`File type not allowed. Allowed types are .png, .jpg, .jpeg.`;
		} else if (err.type === 'validation') {
			errorState = t`File validation error. Please try again.`;
		} else if (err.type === 'upload') {
			errorState = t`File upload error. Please try again.`;
		} else if (err.type === 'custom') {
			errorState = t`Unknown error. Please try again.`;
		}
	}

	async function uploadProcessedFile(file: File) {
		const bucketUrl = await processAndUploadFile(file);
		fileUrl = bucketUrl;
		await onUpload(bucketUrl);
	}

	async function uploadWithoutCrop(file: File) {
		const element = await loadImageToElement(file);
		const processedFile = await resizeImageFile(element, { maxDimension });
		await uploadProcessedFile(processedFile);
	}

	const fileUpload = new FileUpload({
		disabled: () => disabled,
		onSelectedChange: async (file: File | undefined) => {
			oldFileUrl = fileUrl;
			if (!file) return;

			errorState = null;

			try {
				loading = true;
				imageElement = await loadImageToElement(file);

				if (cropEnabled) {
					inProgressFileUrl = URL.createObjectURL(file);
					cropResults = null;
					modalOpen = true;
				} else {
					await uploadWithoutCrop(file);
					revokeBlobUrl(oldFileUrl);
				}
			} catch (error) {
				console.error(error);
				fileUrl = oldFileUrl;
				errorState = t`File upload error. Please try again.`;
			} finally {
				if (!cropEnabled || !modalOpen) {
					loading = false;
				}
			}
		},
		onError: setFileError,
		accept: () => accept,
		maxSize: () => effectiveMaxSize
	});

	async function uploadCroppedImage() {
		if (!cropResults || !imageElement) {
			console.error('Missing image data or crop results.');
			return;
		}

		modalOpen = false;
		loading = true;

		try {
			const croppedFile = await createCroppedFile(imageElement, cropResults);
			await uploadProcessedFile(croppedFile);
		} catch (error) {
			console.error(error);
			fileUrl = oldFileUrl;
			errorState = t`File upload error. Please try again.`;
		} finally {
			revokeBlobUrl(oldFileUrl);
			revokeBlobUrl(inProgressFileUrl);
			inProgressFileUrl = undefined;
			loading = false;
		}
	}

	function handleCancel() {
		revokeBlobUrl(inProgressFileUrl);
		inProgressFileUrl = undefined;
		fileUrl = oldFileUrl;
		modalOpen = false;
		loading = false;
		cropResults = null;
	}
</script>

{#if cropEnabled}
	<ResponsiveModal
		title={t`Upload`}
		description={t`Upload an image to your workspace`}
		bind:open={modalOpen}
	>
		<div class="relative max-h-[500px] min-h-[300px] w-full">
			<Cropper
				image={inProgressFileUrl || undefined}
				bind:crop={cropPosition}
				aspect={resolvedAspectRatio}
				bind:zoom
				oncropcomplete={(e) => {
					cropResults = e.pixels;
				}}
			/>
		</div>

		{#snippet footer()}
			<div class="flex justify-end gap-2">
				<Button variant="outline" onclick={handleCancel}>{t`Cancel`}</Button>
				<Button onclick={uploadCroppedImage} disabled={!cropResults}>{t`Upload`}</Button>
			</div>
		{/snippet}
	</ResponsiveModal>
{/if}

<input {...fileUpload.input} />

{#if trigger}
	{@render trigger({
		triggerProps: fileUpload.trigger,
		loading,
		fileUrl,
		errorState
	})}
{/if}

{#if preview}
	{@render preview({ fileUrl, loading, errorState })}
{/if}

{#if showDropzone}
	<div
		{...fileUpload.dropzone}
		class={cn(
			'group relative flex aspect-video cursor-pointer items-center justify-center rounded-lg bg-linear-to-br from-slate-500 to-slate-300 p-8',
			className
		)}
	>
		{#if fileUrl}
			<img
				src={fileUrl}
				alt="Uploaded result"
				class={cn('absolute inset-0 z-10 h-full w-full rounded-lg object-cover', className)}
			/>
		{/if}
		<div class="z-20 flex flex-col items-center text-center text-white">
			{#if loading}
				<LoaderIcon class="mb-2 h-8 w-8 animate-spin group-hover:text-white" />
				<p class="group-hover:text-white">{t`Loading...`}</p>
			{:else if errorState}
				<BadgeXIcon class="mb-2 h-8 w-8" />
				<p class="group-hover:text-white">{t`Error: `}{errorState}</p>
			{:else if fileUrl}
				<div class="hidden flex-col items-center group-hover:flex">
					<RefreshCCWIcon class="mb-2 h-8 w-8 transition-transform duration-300" />
					<p>{t`Replace image`}</p>
					<p class="text-xs text-white">{t`Allowed: .png, .jpg, .jpeg`}</p>
					<p class="text-xs text-white">{t`Max size: `}{humanReadableMaxFileSize}</p>
				</div>
			{:else}
				<UploadIcon
					class="mb-2 h-8 w-8 transition-transform duration-300 group-hover:-translate-y-1"
				/>
				<p class="text-sm font-medium tracking-tighter">{t`Click or drag to upload image`}</p>
				<p class="text-xs tracking-tighter text-white">{t`Allowed: .png, .jpg, .jpeg`}</p>
				<p class="text-xs tracking-tighter text-white">
					{t`Max size: `}{humanReadableMaxFileSize}
				</p>
			{/if}
		</div>
	</div>
{/if}
