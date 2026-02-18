<script lang="ts">
	import { t } from '$lib/index.svelte';
	import { type ReadPetitionZero } from '$lib/schema/petition/petition';
	let { petition }: { petition: ReadPetitionZero } = $props();
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import { Button } from '$lib/components/ui/button/index.js';
	import ResponsiveModal from '$lib/components/ui/responsive-modal/responsive-modal.svelte';
	import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
	import ShareIcon from '@lucide/svelte/icons/share';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	const id = $props.id();
	import { toast } from 'svelte-sonner';
	import { z } from '$lib/zero.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import { appState } from '$lib/state.svelte';
	import PetitionMakeACopy from './PetitionMakeACopy.svelte';
	import PetitionShareModal from '$lib/components/widgets/petition/share/PetitionShareModal.svelte';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import { goto } from '$app/navigation';

	let openShareModal = $state(false);
	let openMakeACopyModal = $state(false);
	let openDeleteDialog = $state(false);

	function updatePublished(checked: boolean) {
		z.mutate(
			mutators.petition.update({
				metadata: {
					petitionId: petition.id,
					teamId: appState.activeTeamId,
					organizationId: appState.organizationId
				},
				input: {
					published: checked
				}
			})
		);
	}

	async function handleDeleteOrArchive() {
		openDeleteDialog = false;
		if (petition.published) {
			// Archive published petitions
			const batch = z.mutate(
				mutators.petition.archive({
					metadata: {
						petitionId: petition.id,
						teamId: appState.activeTeamId,
						organizationId: appState.organizationId
					}
				})
			);
			await batch.client;
			toast.success(t`Petition archived`);
		} else {
			// Delete draft petitions
			const batch = z.mutate(
				mutators.petition.delete({
					metadata: {
						petitionId: petition.id,
						teamId: appState.activeTeamId,
						organizationId: appState.organizationId
					}
				})
			);
			await batch.client;
			toast.success(t`Petition deleted`);
		}
		goto('/petitions');
	}
</script>

<ButtonGroup.Root>
	<Button variant="outline" onclick={() => (openShareModal = true)}
		><ShareIcon class="size-3.5" /> {t`Share`}</Button
	>
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<Button {...props} variant="outline"
					><ChevronDownIcon class="size-5" /><span class="sr-only">{t`Open`}</span></Button
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
										toast.success(t`Petition published`);
									} else {
										toast.success(t`Petition unpublished`);
									}
								}}
							/>
							<Label for={`${id}-switch`}>{t`Published`}</Label>
						</div>
					{/snippet}
				</DropdownMenu.Item>
				<DropdownMenu.Item>
					{#snippet child({ props })}
						<a {...props} href={`/petitions/${petition.id}/edit`}>{t`Edit petition`}</a>
					{/snippet}
				</DropdownMenu.Item>
			</DropdownMenu.Group>
			<DropdownMenu.Separator />
			<DropdownMenu.Group>
				<DropdownMenu.Item disabled>
					{#snippet child({ props })}
						<a {...props} href={`#`}>{t`Detailed signatures table`}</a>
					{/snippet}
				</DropdownMenu.Item>
			</DropdownMenu.Group>
			<DropdownMenu.Separator />
			<DropdownMenu.Group>
				<DropdownMenu.Item class="w-full" onclick={() => (openMakeACopyModal = true)}>
					{t`Make a copy`}
				</DropdownMenu.Item>
			</DropdownMenu.Group>
			<DropdownMenu.Separator />
			<DropdownMenu.Group>
				<DropdownMenu.Item>
					{#snippet child({ props })}
						<a {...props} href="/petitions/{petition.id}/preview" target="_blank" rel="noopener noreferrer"
							>{t`Preview petition page`}</a
						>
					{/snippet}
				</DropdownMenu.Item>
			</DropdownMenu.Group>
			<DropdownMenu.Separator />
			<DropdownMenu.Group>
				<DropdownMenu.Item
					class="w-full text-destructive"
					onclick={() => (openDeleteDialog = true)}
				>
					<TrashIcon class="size-4 mr-2" />
					{petition.published ? t`Archive petition` : t`Delete petition`}
				</DropdownMenu.Item>
			</DropdownMenu.Group>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</ButtonGroup.Root>

<ResponsiveModal title={t`Share Petition`} bind:open={openShareModal}>
	<PetitionShareModal petitionId={petition.id} />
</ResponsiveModal>
<PetitionMakeACopy {petition} bind:open={openMakeACopyModal} />

<ConfirmDialog
	bind:open={openDeleteDialog}
	title={petition.published ? t`Archive this petition?` : t`Delete this petition?`}
	description={petition.published
		? t`This petition will be archived. You can still view it in the archived petitions list.`
		: t`This draft petition will be permanently deleted. This action cannot be undone.`}
	confirmText={petition.published ? t`Archive` : t`Delete`}
	confirmVariant="destructive"
	onConfirm={handleDeleteOrArchive}
/>
