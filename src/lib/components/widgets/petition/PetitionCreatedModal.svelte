<script lang="ts">
	import { t } from '$lib/index.svelte';
	import type { ReadPetitionZero } from '$lib/schema/petition/petition';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import { MediaQuery } from 'svelte/reactivity';
	import { z } from '$lib/zero.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import { appState } from '$lib/state.svelte';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	import TargetIcon from '@lucide/svelte/icons/target';
	import FileTextIcon from '@lucide/svelte/icons/file-text';

	let {
		petition,
		mode = 'create',
		open = $bindable(false),
		onOpenChange
	}: {
		petition: ReadPetitionZero;
		mode?: 'create' | 'edit';
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
	} = $props();

	const isDesktop = new MediaQuery('(min-width: 768px)');

	async function handlePublishChange(checked: boolean) {
		try {
			await z.mutate(
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
			toast.success(checked ? t`Petition published` : t`Petition unpublished`);
		} catch {
			toast.error(t`Failed to update petition`);
		}
	}

	function handleViewFullPage() {
		goto(`/petitions/${petition.id}/preview`);
	}
</script>

{#if isDesktop.current}
	<Dialog.Root bind:open {onOpenChange}>
		<Dialog.Content class="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
			<Dialog.Header class="relative">
				<Dialog.Title>{mode === 'create' ? t`Petition Created!` : t`Petition Updated!`}</Dialog.Title>
				<Dialog.Description>
					{t`Here's a summary of your petition details.`}
				</Dialog.Description>
			</Dialog.Header>

			{@render petitionPreview()}

			<Dialog.Footer class="flex-col gap-2 pt-4 sm:flex-row">
				{@render actionButtons()}
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{:else}
	<Drawer.Root bind:open {onOpenChange}>
		<Drawer.Content class="max-h-[90vh]">
			<Drawer.Header class="relative text-start">
				<Drawer.Title>{mode === 'create' ? t`Petition Created!` : t`Petition Updated!`}</Drawer.Title>
				<Drawer.Description>
					{t`Here's a summary of your petition details.`}
				</Drawer.Description>
			</Drawer.Header>

			<div class="overflow-y-auto px-4">
				{@render petitionPreview()}
			</div>

			<Drawer.Footer class="flex-col gap-2 pt-4">
				{@render actionButtons()}
			</Drawer.Footer>
		</Drawer.Content>
	</Drawer.Root>
{/if}

{#snippet petitionPreview()}
	<div class="space-y-4">
		{#if !petition.published}
			<div class="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
				<div class="flex items-start gap-3">
					<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-100">
						<CircleAlertIcon class="size-5 text-yellow-600" />
					</div>
					<div class="flex-1">
						<h4 class="font-medium text-yellow-900">{t`Petition not published`}</h4>
						<p class="text-sm text-yellow-700">
							{t`This petition is not published yet. Toggle the switch below to make it visible to your audience.`}
						</p>
					</div>
				</div>
			</div>
		{/if}

		<div class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
			{#if petition.featureImage}
				<div class="relative h-48 w-full">
					<img
						src={petition.featureImage}
						alt={petition.title}
						class="h-full w-full object-cover"
					/>
				</div>
			{/if}

			<div class="p-6">
				<h2 class="mb-4 text-xl font-bold tracking-tight text-gray-900">
					{petition.title}
				</h2>

				<div class="space-y-3">
					{#if petition.petitionTarget}
						<div class="flex items-center space-x-3">
							<div class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
								<TargetIcon class="size-5 text-gray-600" />
							</div>
							<div>
								<div class="text-xs text-gray-500">{t`Petition target`}</div>
								<div class="text-sm font-medium text-gray-900">{petition.petitionTarget}</div>
							</div>
						</div>
					{/if}

					{#if petition.petitionText}
						<div class="flex items-start space-x-3">
							<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100">
								<FileTextIcon class="size-5 text-gray-600" />
							</div>
							<div>
								<div class="text-xs text-gray-500">{t`Petition text`}</div>
								<div class="line-clamp-3 text-sm text-gray-900">{petition.petitionText}</div>
							</div>
						</div>
					{/if}
				</div>

				{#if petition.shortDescription}
					<div class="mt-4 border-t border-gray-100 pt-4">
						<p class="text-gray-700">{petition.shortDescription}</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/snippet}

{#snippet actionButtons()}
	<div class="flex w-full flex-col gap-2 sm:flex-row sm:justify-between">
		<div class="flex items-center gap-3 px-4 py-2">
			<Switch
				id="publish-toggle"
				checked={petition.published}
				onCheckedChange={handlePublishChange}
			/>
			<Label for="publish-toggle" class="cursor-pointer">
				{petition.published ? t`Published` : t`Publish petition`}
			</Label>
		</div>

		<div class="flex gap-2">
			<Button variant="outline" onclick={handleViewFullPage}>
				<ExternalLinkIcon class="mr-2 size-4" />
				{t`View full page`}
			</Button>
		</div>
	</div>
{/snippet}
