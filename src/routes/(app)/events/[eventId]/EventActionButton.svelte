<script lang="ts">
	import { t } from '$lib/index.svelte';
	import { type ReadEventZero } from '$lib/schema/event';
	let { event }: { event: ReadEventZero } = $props();
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { Button } from '$lib/components/ui/button/index.js';
	import ResponsiveModal from '$lib/components/ui/responsive-modal/responsive-modal.svelte';
	import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
	import ShareIcon from '@lucide/svelte/icons/share';
	import EventShareModal from '$lib/components/widgets/event/share/EventShareModal.svelte';
	let openShareModal = $state(false);
	let openMakeACopyModal = $state(false);
	import { Label } from '$lib/components/ui/label/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	const id = $props.id();
	import { toast } from 'svelte-sonner';
	import { z } from '$lib/zero.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import { appState } from '$lib/state.svelte';
	import EventMakeACopy from './EventMakeACopy.svelte';
	import { trackEventPublished } from '$lib/utils/event/analytics';
	let updatingPublished = $state(false);

	async function updatePublished(checked: boolean) {
		const response = z.mutate(
			mutators.event.update({
				metadata: {
					eventId: event.id,
					organizationId: appState.organizationId
				},
				input: {
					published: checked
				}
			})
		);
		const result = await response.server;
		if (result.type === 'error') {
			throw new Error(result.error.message);
		}
	}

	async function handlePublishChange(checked: boolean) {
		if (updatingPublished) return;

		updatingPublished = true;
		try {
			await updatePublished(checked);
			if (checked) {
				trackEventPublished(event);
				toast.success(t`Event published`);
			} else {
				toast.success(t`Event unpublished`);
			}
		} catch (error) {
			toast.error(t`Failed to update event`);
			console.error('Error updating event published status:', error);
		} finally {
			updatingPublished = false;
		}
	}
</script>

<ButtonGroup.Root>
	<Button
		variant="outline"
		onclick={() => (openShareModal = true)}
		data-testid="event-action-button"><ShareIcon class="size-3.5" /> {t`Share`}</Button
	>
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<Button {...props} variant="outline" data-testid="event-action-dropdown"
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
								checked={event.published}
								disabled={updatingPublished}
								onCheckedChange={handlePublishChange}
							/>
							<Label for={`${id}-switch`}>{t`Published`}</Label>
						</div>
					{/snippet}
				</DropdownMenu.Item>
				<DropdownMenu.Item>
					{#snippet child({ props })}
						<a {...props} href={`/events/${event.id}/edit`} data-testid="event-action-edit"
							>{t`Edit event`}</a
						>
					{/snippet}
				</DropdownMenu.Item>
				<DropdownMenu.Item>
					{#snippet child({ props })}
						<a
							data-sveltekit-preload-data="off"
							{...props}
							href={`/events/${event.id}/preview`}
							data-testid="event-action-preview"
							>{#if event.published}{t`View event page`}{:else}{t`Preview event page`}{/if}</a
						>
					{/snippet}
				</DropdownMenu.Item>
			</DropdownMenu.Group>
			<DropdownMenu.Separator />
			<DropdownMenu.Group>
				<DropdownMenu.Item>
					{#snippet child({ props })}
						<a {...props} href={`/events/${event.id}/signups`} data-testid="event-action-signups"
							>{t`Detailed signups table`}</a
						>
					{/snippet}
				</DropdownMenu.Item>
			</DropdownMenu.Group>
			{#if event.published}
				<DropdownMenu.Separator />
				<DropdownMenu.Group>
					<DropdownMenu.Item
						class="w-full"
						onclick={() =>
							z.mutate(
								mutators.event.archive({
									metadata: {
										organizationId: appState.organizationId,
										eventId: event.id
									}
								})
							)}
					>
						{t`Archive`}
					</DropdownMenu.Item>
				</DropdownMenu.Group>
			{/if}
			<DropdownMenu.Separator />
			<DropdownMenu.Group>
				<DropdownMenu.Item class="w-full" onclick={() => (openMakeACopyModal = true)}>
					{t`Make a copy`}
				</DropdownMenu.Item>
			</DropdownMenu.Group>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</ButtonGroup.Root>

<ResponsiveModal title="Share Event" bind:open={openShareModal}>
	<EventShareModal eventId={event.id} />
</ResponsiveModal>
<EventMakeACopy {event} bind:open={openMakeACopyModal} />
