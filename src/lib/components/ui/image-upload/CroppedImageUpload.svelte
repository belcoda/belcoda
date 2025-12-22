<script lang="ts" module>
	import UploadIcon from '@lucide/svelte/icons/upload';
	import LoaderIcon from '@lucide/svelte/icons/loader';
	import BadgeXIcon from '@lucide/svelte/icons/badge-x';
	import RefreshCCWIcon from '@lucide/svelte/icons/refresh-ccw';
</script>

<script lang="ts">
	import ResponsiveModal from '$lib/components/ui/responsive-modal/responsive-modal.svelte';
	import { FileUpload } from 'melt/builders';
	import { cn } from '$lib/utils.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import Cropper from 'svelte-easy-crop';
	import {
		createCroppedFile,
		processAndUploadFile,
		loadImageToElement
	} from '$lib/components/ui/image-upload/upload_utils';

	// --- Props and State ---

	type CropResults = { x: number; y: number; width: number; height: number };

	type Props = {
		fileUrl?: string | null | undefined;
		class?: string;
		onUpload?: (url: string) => Promise<void>;
		aspectRatio?: number;
	};
	let {
		fileUrl = undefined,
		class: className,
		onUpload = async () => {},
		aspectRatio = 16 / 9
	}: Props = $props();

	let loading = $state(false);
	let modalOpen = $state(false);
	let errorState: string | null = $state(null);
	let oldFileUrl = $state<string | null | undefined>(undefined);
	let inProgressFileUrl = $state<string | null | undefined>(undefined);
	const HUMAN_READABLE_MAX_FILE_SIZE = '2MB';

	// The original File object is needed for creating the cropped image
	let originalFile = $state<File | undefined>(undefined);
	let imageElement = $state<HTMLImageElement | undefined>(undefined); // The loaded <img> element

	let crop = $state({ x: 0, y: 0 });
	let zoom = $state(1);
	let cropResults = $state<CropResults | null>(null);

	// --- Handlers ---

	const fileUpload = new FileUpload({
		onSelectedChange: async (file: File | undefined) => {
			oldFileUrl = fileUrl;
			if (!file) return;

			originalFile = file; // Store the original file
			try {
				loading = true;

				// 1. Load the file as a Blob URL for the Cropper component's 'image' prop
				inProgressFileUrl = URL.createObjectURL(file);

				// 2. Load the file into an Image element for the drawing step
				imageElement = await loadImageToElement(file);

				modalOpen = true;
			} catch (error) {
				console.error(error);
				fileUrl = oldFileUrl;
				errorState = 'custom';
			}
		},
		onError: (err: {
			type: 'size' | 'type' | 'validation' | 'upload' | 'custom';
			message: string;
		}) => {
			if (err.type === 'size') {
				errorState = `File too large. Max size is ${HUMAN_READABLE_MAX_FILE_SIZE}.`;
			} else if (err.type === 'type') {
				errorState = `File type not allowed. Allowed types are .png, .jpg, .jpeg.`;
			} else if (err.type === 'validation') {
				errorState = `File validation error. Please try again.`;
			} else if (err.type === 'upload') {
				errorState = `File upload error. Please try again.`;
			} else if (err.type === 'custom') {
				errorState = `Unknown error. Please try again.`;
			}
		},
		accept: '.png, .jpg, .jpeg',
		maxSize: 2 * 1024 * 1024 // 2 MB
	});

	async function uploadCroppedImage() {
		if (!cropResults || !imageElement || !originalFile) {
			console.error('Missing image data or crop results.');
			return;
		}

		modalOpen = false;
		loading = true;

		try {
			// 1. Create the new cropped File object using the utility function
			const croppedFile = await createCroppedFile(imageElement, cropResults);

			// 2. Upload the new file to S3 via your API, using the utility function
			const bucketUrl = await processAndUploadFile(croppedFile);

			// 3. Update state and notify parent
			fileUrl = bucketUrl;
			await onUpload(bucketUrl);
		} catch (error) {
			fileUrl = oldFileUrl;
			errorState = 'upload';
		} finally {
			// Clean up the temporary Blob URL
			if (oldFileUrl && oldFileUrl.startsWith('blob:')) {
				URL.revokeObjectURL(oldFileUrl);
			}
			if (inProgressFileUrl && inProgressFileUrl.startsWith('blob:')) {
				URL.revokeObjectURL(inProgressFileUrl);
			}
			loading = false;
			errorState = null;
		}
	}

	function handleCancel() {
		// Revert fileUrl to the state before the user opened the modal
		if (fileUrl && fileUrl.startsWith('blob:')) {
			URL.revokeObjectURL(fileUrl);
		}
		if (inProgressFileUrl && inProgressFileUrl.startsWith('blob:')) {
			URL.revokeObjectURL(inProgressFileUrl);
		}
		fileUrl = oldFileUrl;
		inProgressFileUrl = undefined;
		modalOpen = false;
		loading = false;
	}
</script>

<ResponsiveModal
	title="Upload"
	description="Upload an image to your workspace"
	bind:open={modalOpen}
>
	<div class="relative max-h-[500px] min-h-[300px] w-full">
		<Cropper
			image={inProgressFileUrl || undefined}
			bind:crop
			aspect={aspectRatio}
			bind:zoom
			oncropcomplete={(e) => {
				cropResults = e.pixels;
			}}
		/>
	</div>

	{#snippet footer()}
		<div class="flex justify-end gap-2">
			<Button variant="outline" onclick={handleCancel}>Cancel</Button>
			<Button onclick={uploadCroppedImage} disabled={!cropResults}>Upload</Button>
		</div>
	{/snippet}
</ResponsiveModal>

<input {...fileUpload.input} />
<div
	{...fileUpload.dropzone}
	class={cn(
		'group relative flex aspect-video cursor-pointer items-center justify-center rounded-lg bg-linear-to-br from-slate-500 to-slate-300 p-8',
		className
	)}
>
	{#if fileUrl}<img
			src={fileUrl}
			alt="Uploaded result"
			class={cn('absolute inset-0 z-10 h-full w-full rounded-lg object-cover', className)}
		/>{/if}
	<div class="z-20 flex flex-col items-center text-center text-white">
		{#if loading}
			<LoaderIcon class="mb-2 h-8 w-8 animate-spin group-hover:text-white" />
			<p class="group-hover:text-white">Loading...</p>
		{:else if errorState}
			<BadgeXIcon class="mb-2 h-8 w-8" />
			<p class="group-hover:text-white">Error: {errorState}</p>
		{:else if fileUrl}
			<div class="hidden flex-col items-center group-hover:flex">
				<RefreshCCWIcon class="mb-2 h-8 w-8 transition-transform duration-300" />
				<p>Replace image</p>
				<p class="text-xs text-white">Allowed: .png, .jpg, .jpeg</p>
				<p class="text-xs text-white">Max size: {HUMAN_READABLE_MAX_FILE_SIZE}</p>
			</div>
		{:else}
			<UploadIcon
				class="mb-2 h-8 w-8 transition-transform duration-300 group-hover:-translate-y-1"
			/>
			<p class="text-sm font-medium tracking-tighter">Click or drag to upload image</p>
			<p class="text-xs tracking-tighter text-white">Allowed: .png, .jpg, .jpeg</p>
			<p class="text-xs tracking-tighter text-white">Max size: 2MB</p>
		{/if}
	</div>
</div>
