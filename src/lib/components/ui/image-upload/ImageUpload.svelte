<script lang="ts" module>
	import UploadIcon from '@lucide/svelte/icons/upload';
	import LoaderIcon from '@lucide/svelte/icons/loader';
</script>

<script lang="ts">
	import { v4 as uuidv4 } from 'uuid';
	import { page } from '$app/state';
	import { appState } from '$lib/state.svelte';
	import Cropper from 'svelte-easy-crop';

	import { env } from '$env/dynamic/public';
	const { PUBLIC_AWS_S3_SITE_UPLOADS_BUCKET_NAME } = env;
	import ResponsiveModal from '$lib/components/ui/responsive-modal/responsive-modal.svelte';

	type Props = {
		class?: string;
		onUploadFinished?: (url: string) => Promise<void>;
		fileUrl?: string | null;
		roundedBottom?: boolean;
		uploadUrl?: string;
	};
	let {
		onUploadFinished = async () => {},
		fileUrl = null,
		class: className,
		uploadUrl = '/api/utils/upload',
		roundedBottom = true
	}: Props = $props();

	async function getUploadUrl(fileKey: string) {
		const result = await fetch(`${uploadUrl}?key=${fileKey}`).then((res) => res.json());
		return result;
	}

	function renameFile(file: File) {
		try {
			const fileKey = `workspace/${page.data.workspace.id}/imageupload/${uuidv4()}-${file.name}`;
			return { fileKey, fileToUpload: new File([file], fileKey, { type: file.type }) };
		} catch (err) {
			const fileKey = `workspace/global/imageupload/${uuidv4()}`;
			return { fileKey, fileToUpload: new File([file], fileKey, { type: file.type }) };
		}
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
		const uploadedFilePath = new URL(response.url).pathname; // Get the path of the uploaded file on AWS that we will add to our bucket URL
		return uploadedFilePath;
	}

	let loading: boolean = $state(false);
	let errorState: 'noError' | 'size' | 'type' | 'validation' | 'upload' | 'custom' =
		$state('noError');
	const humanReadableMaxFileSize = '2MB';

	import { FileUpload } from 'melt/builders';

	const fileUpload = new FileUpload({
		onSelectedChange: async (file: File | undefined) => {
			const oldFileUrl = fileUrl; // Store the old file URL to revert if needed
			try {
				errorState = 'noError';
				if (!file) return;
				fileUrl = URL.createObjectURL(file);

				loading = true;
				open = true;
				const { fileKey, fileToUpload } = renameFile(file);
				const uploadUrl = await getUploadUrl(fileKey);
				const uploadedFilePath = await uploadToS3(fileToUpload, uploadUrl);
				const bucketUrl = `https://${PUBLIC_AWS_S3_SITE_UPLOADS_BUCKET_NAME}.s3.amazonaws.com${uploadedFilePath}`;
				fileUrl = bucketUrl;
				await onUploadFinished(bucketUrl);
			} catch (err) {
				console.error(err);
				errorState = 'upload';
				loading = false;
				fileUrl = oldFileUrl;
			} finally {
				loading = false;
			}
		},
		onError: (err: { type: 'size' | 'type' | 'validation' | 'upload' | 'custom' }) =>
			(errorState = err.type),
		accept: '.png, .jpg, .jpeg',
		maxSize: 2 * 1024 * 1024 // 2 MB //TODO: Use an image processing service to resize the image.
	});
	import BadgeXIcon from '@lucide/svelte/icons/badge-x';
	import RefreshCCWIcon from '@lucide/svelte/icons/refresh-ccw';
	import { cn } from '$lib/utils.js';
	import { t } from '$lib/index.svelte';
	let title = t`Upload Image`;
	let description = t`Upload an image to your workspace`;
	let open = $state(false);
	let crop = $state({ x: 0, y: 0 });
	let zoom = $state(1);
</script>

<ResponsiveModal {title} {description} bind:open>
	{#if fileUrl}
		<div class="relative max-h-[500px] min-h-[100px] w-full">
			<Cropper
				image={fileUrl}
				bind:crop
				aspect={16 / 9}
				bind:zoom
				oncropcomplete={(e) => {
					if (!fileUrl) return;
					const img = new Image(e.pixels.width, e.pixels.height);
					img.src = fileUrl;
					const canvas = document.createElement('canvas');
					const ctx = canvas.getContext('2d');
					if (!ctx) return;
					canvas.width = e.pixels.width;
					canvas.height = e.pixels.height;
					ctx.drawImage(
						img, // The original Image object
						e.pixels.x,
						e.pixels.y, // Source x, y (top-left corner of the crop)
						e.pixels.width,
						e.pixels.height, // Source width, height (the dimensions to crop)
						0,
						0, // Destination x, y (start drawing at the canvas top-left)
						e.pixels.width,
						e.pixels.height // Destination width, height (the final size on canvas)
					);
					const outputFormat = 'image/jpeg';
					// Optional: Quality (0.0 to 1.0) for JPEG/WebP formats
					const quality = 0.9;

					// The toBlob method returns the Blob asynchronously
					canvas.toBlob(
						(blob) => {
							// The blob variable now contains the cropped image data
							// Proceed to Step 4 here...
						},
						outputFormat,
						quality
					);
				}}
			/>
		</div>
	{/if}
</ResponsiveModal>
<input {...fileUpload.input} />
<div
	{...fileUpload.dropzone}
	class={cn(
		'relative flex aspect-video min-h-[200px] w-full cursor-pointer items-center justify-center rounded-lg bg-linear-to-br from-blue-400 to-purple-300',
		roundedBottom === false ? 'rounded-b-none' : ''
	)}
>
	<!-- We always want to refresh the file if there is a file in there, unless it's loading -->
	{#if fileUrl && !loading}
		<div
			class="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-white/30 opacity-0 transition-opacity duration-300 hover:opacity-100"
		>
			<RefreshCCWIcon class="size-6 text-white" />
		</div>
	{/if}

	{#if loading}
		<div class="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-white/30">
			<LoaderIcon class="animate size-6 animate-spin text-white" />
		</div>
	{/if}
	<!-- Finally the base layer. -->

	{#if fileUrl}
		<img
			src={fileUrl}
			alt="Preview"
			class={cn(
				'relative h-auto w-full rounded-lg object-cover',
				className,
				roundedBottom ? 'rounded-b-none' : ''
			)}
		/>
	{:else}
		<div class="absolute inset-0 z-20 flex items-center justify-center">
			{@render showItem(errorState)}
		</div>
		<div
			role="none"
			class="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-white/30 opacity-0 hover:opacity-100"
		>
			<UploadIcon class="size-6 text-white" />
		</div>
	{/if}
</div>

{#snippet showItem(currentState: typeof errorState)}
	{#if currentState === 'size'}
		<div class="text-white">
			<div class="flex justify-center"><BadgeXIcon class="size-5" /></div>
			<div class="text-center text-sm font-medium">{t`Too large!`}</div>
			<div class="text-center text-xs font-medium">
				{t`(Max ${humanReadableMaxFileSize})`}
			</div>
		</div>
	{:else if currentState === 'type'}
		<div class="text-white">
			<div class="flex justify-center"><BadgeXIcon class="size-5" /></div>
			<div class="text-center text-sm font-medium">{t`Wrong file type!`}</div>
			<div class="text-center text-xs font-medium">{t`Allowed: .png, .jpg, .jpeg`}</div>
		</div>
	{:else if currentState === 'validation'}
		<div class="text-white">
			<div class="flex justify-center"><BadgeXIcon class="size-5" /></div>
			<div class="text-center text-sm font-medium">{t`Validation error!`}</div>
			<div class="text-center text-xs font-medium">{t`Please try again.`}</div>
		</div>
	{:else if currentState === 'upload'}
		<div class="text-white">
			<div class="flex justify-center"><BadgeXIcon class="size-5" /></div>
			<div class="text-center text-sm font-medium">{t`Upload error!`}</div>
			<div class="text-center text-xs font-medium">{t`Please try again.`}</div>
		</div>
	{:else if currentState === 'custom'}
		<div class="text-white">
			<div class="flex justify-center"><BadgeXIcon class="size-5" /></div>
			<div class="text-center text-sm font-medium">{t`Error`}</div>
			<div class="text-center text-xs font-medium">{t`Unknown error`}</div>
		</div>
	{:else}
		<div>
			<div class="flex justify-center"><UploadIcon class="size-4 text-white" /></div>
			<div class="text-center text-sm font-medium text-white">{t`Upload an image`}</div>
			<div class="text-center text-xs font-medium text-white">
				{t`(Max size: ${humanReadableMaxFileSize})`}
			</div>
		</div>
	{/if}
{/snippet}
