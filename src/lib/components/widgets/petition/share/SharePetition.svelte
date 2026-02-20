<script lang="ts">
	import { type ReadPetitionZero } from '$lib/schema/petition/petition';
	import { type ReadActionCodeZero } from '$lib/schema/action-code';
	let { petition, actionCode }: { petition: ReadPetitionZero; actionCode: ReadActionCodeZero } = $props();
	import { t } from '$lib/index.svelte';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { generateWhatsAppQRCode } from '$lib/utils/qr';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import { appState } from '$lib/state.svelte';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import { generateWhatsAppPetitionLink, getPetitionLink } from '$lib/utils/petitions/link';
	const whatsAppSignupLink = $derived(
		generateWhatsAppPetitionLink({
			petitionTitle: petition.title,
			whatsAppNumber: appState.activeOrganization?.data?.settings.whatsApp?.number,
			actionCode: actionCode.id
		})
	);
	import { UseClipboard } from '$lib/hooks/use-clipboard.svelte';
	const clipboard = new UseClipboard();
	import CheckIcon from '@lucide/svelte/icons/check';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import { Label } from '$lib/components/ui/label/index.js';
	import { toast } from 'svelte-sonner';
	const petitionPageLink = $derived(
		getPetitionLink({
			petitionSlug: petition.slug,
			organizationSlug: appState.activeOrganization.data?.slug || ''
		})
	);
</script>

<div class="grid w-full max-w-md gap-4">
	<div class="text-sm text-muted-foreground">{t`Share this petition with your audience`}</div>
	<div class="space-y-2">
		<Label>{t`Petition page link`}</Label>
		<InputGroup.Root>
			<InputGroup.Input value={petitionPageLink} readonly />
			<InputGroup.Addon align="inline-end">
				<InputGroup.Button
					aria-label={t`Copy`}
					title={t`Copy`}
					size="icon-xs"
					onclick={() => {
						clipboard.copy(petitionPageLink);
						toast.success(t`Copied to clipboard`);
					}}
				>
					{#if clipboard.copied}
						<CheckIcon />
					{:else}
						<CopyIcon />
					{/if}
				</InputGroup.Button>
			</InputGroup.Addon>
		</InputGroup.Root>
	</div>
	<div class="space-y-2">
		<Label>{t`WhatsApp signup link`}</Label>
		<InputGroup.Root>
			<InputGroup.Input value={whatsAppSignupLink} readonly />
			<InputGroup.Addon align="inline-end">
				<InputGroup.Button
					aria-label={t`Copy`}
					title={t`Copy`}
					size="icon-xs"
					onclick={() => {
						clipboard.copy(whatsAppSignupLink);
						toast.success(t`Copied to clipboard`);
					}}
				>
					{#if clipboard.copied}
						<CheckIcon />
					{:else}
						<CopyIcon />
					{/if}
				</InputGroup.Button>
			</InputGroup.Addon>
		</InputGroup.Root>
	</div>
	{@render qrCode()}
</div>

{#snippet qrCode()}
	<Collapsible.Root class="space-y-2">
		<div class="flex items-center justify-between space-x-4">
			<h4 class="text-sm font-semibold">{t`View WhatsApp signup QR code`}</h4>
			<Collapsible.Trigger
				class={buttonVariants({ variant: 'ghost', size: 'sm', class: 'w-9 p-0' })}
			>
				<ChevronsUpDownIcon />
				<span class="sr-only">{t`Toggle`}</span>
			</Collapsible.Trigger>
		</div>
		<Collapsible.Content class="space-y-2">
			{#await generateWhatsAppQRCode(whatsAppSignupLink)}
				<div class="flex items-center justify-center">
					<Skeleton class="aspect-square size-24" />
				</div>
			{:then qrCode}
				<img src={qrCode} alt={t`WhatsApp checkin link`} class="mx-auto" />
				<Button
					variant="outline"
					class="w-full"
					onclick={() => {
						const link = document.createElement('a');
						link.href = qrCode;
						link.download = `petition-${petition.slug}-signup-qr-code.png`;
						link.click();
					}}
				>
					<DownloadIcon /> {t`Download QR code`}</Button
				>
			{/await}
		</Collapsible.Content>
	</Collapsible.Root>
{/snippet}
