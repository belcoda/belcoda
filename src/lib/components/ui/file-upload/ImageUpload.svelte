<script lang="ts">
	import { upload } from '@tigrisdata/storage/client';
	import ImagePlusIcon from '@lucide/svelte/icons/image-plus';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import { Progress } from '$lib/components/ui/progress/index.js';
	import { cn } from '$lib/utils.js';
	import { useId } from 'bits-ui';
	import { getUploadPath } from './helpers';
	import { t } from '$lib/index.svelte';

	let {
		organizationId,
		url = $bindable(null),
		maxSizeBytes,
		aspectRatio = 'video',
		class: className,
		onUpload
	}: {
		organizationId: string;
		url?: string | null;
		/** Optional max file size in bytes. When set, larger files are rejected before upload. */
		maxSizeBytes?: number;
		aspectRatio?: 'video' | 'square';
		class?: string;
		/** Called with the uploaded file's URL once an upload finishes successfully. */
		onUpload?: (url: string) => void;
	} = $props();

	let progress = $state(0);
	let status = $state<'idle' | 'uploading' | 'error'>('idle');
	let errorMessage = $state<string | null>(null);

	const inputId = `file-upload-${useId()}`;
	const hasImage = $derived(Boolean(url));
	const isUploading = $derived(status === 'uploading');

	const handleFileChange = async (e: Event) => {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		progress = 0;
		errorMessage = null;

		if (!file) {
			status = 'idle';
			return;
		}

		if (maxSizeBytes && file.size > maxSizeBytes) {
			status = 'error';
			const limitLabel =
				maxSizeBytes >= 1024 * 1024
					? `${Math.round(maxSizeBytes / (1024 * 1024))}MB`
					: `${Math.round(maxSizeBytes / 1024)}KB`;
			errorMessage = t`Image is too large. Please choose a file under ${limitLabel}.`;
			input.value = '';
			return;
		}

		status = 'uploading';

		// rename the file to include the organizationId and a uuidv7
		const result = await upload(getUploadPath(organizationId, file.name), file, {
			url: `/api/utils/upload/${organizationId}/tigris`,
			access: 'public',
			multipart: true,
			partSize: 10 * 1024 * 1024, // 10 MiB parts
			onUploadProgress: ({ percentage }) => {
				status = 'uploading';
				progress = percentage;
			}
		});

		input.value = '';

		if (result.error) {
			status = 'error';
			errorMessage = result.error.message || t`Upload failed. Please try again.`;
			return;
		}

		status = 'idle';
		// The SDK returns a time-limited presigned GET URL (expires in ~1h). The
		// bucket is public, so the object is permanently reachable at the same URL
		// without the signature — strip the query string to get a durable URL that
		// won't rot inside stored content.
		url = toDurableUrl(result?.data?.url ?? null);
		if (url) onUpload?.(url);
	};

	// Remove the presigned-URL query string (`?X-Amz-*`) to yield the object's
	// stable public URL. Format-agnostic: works for both virtual-hosted
	// (`<bucket>.t3.storage.dev/<key>`) and path-style URLs.
	function toDurableUrl(rawUrl: string | null): string | null {
		if (!rawUrl) return null;
		return rawUrl.split('?')[0];
	}
</script>

<div class={cn('w-full space-y-2', className)}>
	<input
		id={inputId}
		type="file"
		accept="image/*"
		class="sr-only"
		disabled={isUploading}
		onchange={handleFileChange}
		aria-describedby={errorMessage ? `${inputId}-error` : undefined}
	/>

	<label
		for={inputId}
		aria-busy={isUploading}
		class:aspect-video={aspectRatio === 'video'}
		class:aspect-square={aspectRatio === 'square'}
		class={cn(
			'group relative flex w-full cursor-pointer overflow-hidden rounded-lg border border-dashed border-border bg-muted/30 transition-colors outline-none',
			'hover:border-primary/50 hover:bg-muted/50',
			'focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-3',
			hasImage && 'border-solid border-border bg-muted/20',
			isUploading && 'pointer-events-none cursor-not-allowed opacity-70'
		)}
	>
		{#if hasImage}
			<img src={url} alt={t`Cover preview`} class="size-full object-cover" />

			<span
				class="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100"
			>
				<span
					class="inline-flex items-center gap-1.5 rounded-md bg-background/95 px-2.5 py-1.5 text-xs font-medium shadow-xs"
				>
					<PencilIcon class="size-3.5" aria-hidden="true" />
					{t`Change image`}
				</span>
			</span>
		{:else}
			<span class="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
				<span
					class="bg-background text-muted-foreground flex size-10 items-center justify-center rounded-full border shadow-xs"
				>
					<ImagePlusIcon class="size-5" aria-hidden="true" />
				</span>
				<span class="space-y-0.5">
					<span class="text-sm font-medium">{t`Click to upload an image`}</span>
					<span class="text-muted-foreground block text-xs">{t`PNG, JPG, or WebP`}</span>
				</span>
			</span>
		{/if}

		{#if isUploading}
			<span
				class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 px-6 backdrop-blur-[1px]"
				aria-live="polite"
			>
				<span class="text-sm font-medium">{t`Uploading…`}</span>
				<Progress value={progress} class="h-1.5 w-full max-w-48" />
				<span class="text-muted-foreground text-xs tabular-nums">{Math.round(progress)}%</span>
			</span>
		{/if}
	</label>

	{#if errorMessage}
		<p id={`${inputId}-error`} class="text-destructive text-sm" role="alert">
			{errorMessage}
		</p>
	{/if}
</div>
