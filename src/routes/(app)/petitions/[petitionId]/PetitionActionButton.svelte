<script lang="ts">
	import { type ReadPetitionZero } from '$lib/schema/petition/petition';
	let { petition }: { petition: ReadPetitionZero } = $props();
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { Button } from '$lib/components/ui/button/index.js';
	import ResponsiveModal from '$lib/components/ui/responsive-modal/responsive-modal.svelte';
	import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
	import ShareIcon from '@lucide/svelte/icons/share';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	const id = $props.id();
	import { toast } from 'svelte-sonner';
	import { z } from '$lib/zero.svelte';
	import { appState } from '$lib/state.svelte';
	import { env } from '$env/dynamic/public';
	import { dev } from '$app/environment';
	import PetitionMakeACopy from './PetitionMakeACopy.svelte';

	const { PUBLIC_ROOT_DOMAIN } = env;

	let openShareModal = $state(false);
	let openMakeACopyModal = $state(false);

	const petitionPageUrl = $derived(() => {
		const orgSlug = appState.activeOrganization.data?.slug;
		if (!orgSlug || !petition.slug) {
			return '#';
		}
		const protocol = dev ? 'http' : 'https';
		return `${protocol}://${orgSlug}.${PUBLIC_ROOT_DOMAIN}/page/${orgSlug}/petitions/${petition.slug}`;
	});

	function updatePublished(checked: boolean) {
		z.mutate.petition.update({
			metadata: {
				petitionId: petition.id,
				teamId: appState.activeTeamId,
				organizationId: appState.organizationId
			},
			input: {
				published: checked
			}
		});
	}
</script>

<ButtonGroup.Root>
	<Button variant="outline" onclick={() => (openShareModal = true)}
		><ShareIcon class="size-3.5" /> Share</Button
	>
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<Button {...props} variant="outline"
					><ChevronDownIcon class="size-5" /><span class="sr-only">Open</span></Button
				>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="start">
			<DropdownMenu.Group>
				<DropdownMenu.Item>
					{#snippet child({ props })}
						<div class="flex items-center gap-2" {...props}>
							<Switch
								id={`${id}-switch`}
								checked={petition.published}
								onCheckedChange={(checked) => {
									updatePublished(checked);
									if (checked) {
										toast.success('Petition published');
									} else {
										toast.success('Petition unpublished');
									}
								}}
							/>
							<Label for={`${id}-switch`}>Published</Label>
						</div>
					{/snippet}
				</DropdownMenu.Item>
				<DropdownMenu.Item>
					{#snippet child({ props })}
						<a {...props} href={`/petitions/${petition.id}/edit`}>Edit petition</a>
					{/snippet}
				</DropdownMenu.Item>
			</DropdownMenu.Group>
			<DropdownMenu.Separator />
			<DropdownMenu.Group>
				<DropdownMenu.Item disabled>
					{#snippet child({ props })}
						<a {...props} href={`#`}>Detailed signatures table</a>
					{/snippet}
				</DropdownMenu.Item>
			</DropdownMenu.Group>
			<DropdownMenu.Separator />
			<DropdownMenu.Group>
				<DropdownMenu.Item>
					{#snippet child({ props })}
						<a {...props} href={petitionPageUrl()} target="_blank" rel="noopener noreferrer"
							>{#if petition.published}View petition page{:else}Preview petition page{/if}</a
						>
					{/snippet}
				</DropdownMenu.Item>
			</DropdownMenu.Group>
			<DropdownMenu.Separator />
			<DropdownMenu.Group>
				<DropdownMenu.Item class="w-full" onclick={() => (openMakeACopyModal = true)}>
					Make a copy
				</DropdownMenu.Item>
			</DropdownMenu.Group>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</ButtonGroup.Root>

<ResponsiveModal title="Share Petition" bind:open={openShareModal}>
	<div class="space-y-4">
		<p class="text-sm text-muted-foreground">Share functionality coming soon...</p>
		<!-- TODO: Add petition share modal component -->
	</div>
</ResponsiveModal>
<PetitionMakeACopy {petition} bind:open={openMakeACopyModal} />
