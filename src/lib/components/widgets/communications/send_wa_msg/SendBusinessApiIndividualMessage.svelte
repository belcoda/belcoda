<script lang="ts">
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import LoaderIcon from '@lucide/svelte/icons/loader';
	import XIcon from '@lucide/svelte/icons/x';
	import ImagePlusIcon from '@lucide/svelte/icons/image-plus';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import ImageUploadNew from '$lib/components/ui/image-upload/ImageUploadNew.svelte';
	import type { WhatsappMessage } from '$lib/schema/whatsapp/message';
	import { t } from '$lib/index.svelte';
	import { cn } from '$lib/utils.js';
	import { v7 as uuidv7 } from 'uuid';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import { z } from '$lib/zero.svelte';
	import { appState } from '$lib/state.svelte';

	const { personId }: { personId: string } = $props();

	let imageUpload = $state<{ openFilePicker: (e?: MouseEvent) => void } | undefined>(undefined);
	let imageLoading = $state(false);

	function returnDefaultMessageState(): WhatsappMessage {
		return {
			id: uuidv7(),
			text: '',
			image_url: undefined,
			emojiReactions: []
		};
	}

	let messageState: WhatsappMessage = $state(returnDefaultMessageState());

	const showImagePreview = $derived(imageLoading || !!messageState.image_url);

	function removeImage() {
		messageState.image_url = undefined;
	}

	async function sendMessage() {
		await z.mutate(
			mutators.whatsappMessage.sendIndividualMessage({
				input: {
					whatsappMessage: $state.snapshot(messageState)
				},
				metadata: {
					organizationId: appState.organizationId,
					personId: personId,
					activityId: uuidv7(),
					sentByUserId: appState.userId,
					whatsappMessageId: $state.snapshot(messageState.id)
				}
			})
		);
		messageState = returnDefaultMessageState();
	}
</script>

<InputGroup.Root>
	{#if showImagePreview}
		<InputGroup.Addon align="block-start" class="w-full [.border-b]:pb-3">
			<div
				class={cn(
					'relative w-full overflow-hidden rounded-md border bg-muted/40',
					imageLoading && !messageState.image_url ? 'min-h-28' : 'max-h-32'
				)}
			>
				{#if imageLoading && !messageState.image_url}
					<div class="flex min-h-28 items-center justify-center">
						<LoaderIcon class="size-6 animate-spin text-muted-foreground" />
						<span class="sr-only">{t`Uploading image…`}</span>
					</div>
				{:else if messageState.image_url}
					<img
						src={messageState.image_url}
						alt={t`Image attachment preview`}
						class="max-h-32 w-full object-cover"
					/>
					{#if imageLoading}
						<div
							class="absolute inset-0 flex items-center justify-center bg-background/60"
							aria-hidden="true"
						>
							<LoaderIcon class="size-6 animate-spin text-muted-foreground" />
						</div>
					{/if}
				{/if}
				{#if messageState.image_url && !imageLoading}
					<InputGroup.Button
						type="button"
						variant="ghost"
						size="icon-xs"
						class="absolute top-1.5 right-1.5 rounded-full bg-background/90 shadow-sm hover:bg-background"
						onclick={removeImage}
						aria-label={t`Remove image`}
					>
						<XIcon />
					</InputGroup.Button>
				{/if}
			</div>
		</InputGroup.Addon>
	{/if}

	<InputGroup.Textarea placeholder={t`Write your message...`} bind:value={messageState.text} />

	<InputGroup.Addon align="block-end">
		<ImageUploadNew
			bind:this={imageUpload}
			bind:loading={imageLoading}
			bind:fileUrl={messageState.image_url}
			showDropzone={false}
			onUpload={(url) => {
				messageState.image_url = url;
			}}
		/>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<InputGroup.Button {...props} variant="outline" class="rounded-full" size="icon-xs">
						<PlusIcon />
					</InputGroup.Button>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content>
				<DropdownMenu.Item onclick={() => imageUpload?.openFilePicker()}>
					<ImagePlusIcon />
					{t`Add image`}
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
		<InputGroup.Button
			variant="default"
			class="ml-auto rounded-full"
			size="icon-xs"
			disabled={messageState.text?.length === 0 && !messageState.image_url}
			onclick={sendMessage}
		>
			<ArrowUpIcon />
			<span class="sr-only">{t`Send`}</span>
		</InputGroup.Button>
	</InputGroup.Addon>
</InputGroup.Root>
