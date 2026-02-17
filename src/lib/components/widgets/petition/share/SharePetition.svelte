<script lang="ts">
	import { type ReadPetitionZero } from '$lib/schema/petition/petition';
	let { petition }: { petition: ReadPetitionZero } = $props();
	import { t } from '$lib/index.svelte';
	import { appState } from '$lib/state.svelte';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import { getPetitionLink } from '$lib/utils/petitions/link';
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
</div>
