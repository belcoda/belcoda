<script lang="ts">
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
	import { Label } from '$lib/components/ui/label/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	const id = $props.id();
	import { toast } from 'svelte-sonner';
	import { z } from '$lib/zero.svelte';
	import { appState } from '$lib/state.svelte';
	import { onMount } from 'svelte';
	function updatePublished(checked: boolean) {
		z.mutate.event.update({
			metadata: {
				eventId: event.id,
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
								checked={event.published}
								onCheckedChange={(checked) => {
									updatePublished(checked);
									if (checked) {
										toast.success('Event published');
									} else {
										toast.success('Event unpublished');
									}
								}}
							/>
							<Label for={`${id}-switch`}>Published</Label>
						</div>
					{/snippet}
				</DropdownMenu.Item>
				<DropdownMenu.Item>
					{#snippet child({ props })}
						<a {...props} href={`/events/${event.id}/edit`}>Edit event</a>
					{/snippet}
				</DropdownMenu.Item>
			</DropdownMenu.Group>
			<DropdownMenu.Separator />
			<DropdownMenu.Group>
				<DropdownMenu.Item>
					{#snippet child({ props })}
						<a {...props} href={`/events/${event.id}/signups`}>Detailed signups table</a>
					{/snippet}
				</DropdownMenu.Item>
			</DropdownMenu.Group>
			<DropdownMenu.Separator />
			<DropdownMenu.Group>
				<DropdownMenu.Item>
					{#snippet child({ props })}
						<a {...props} href={`/events/${event.id}/page`}
							>{#if event.published}View event page{:else}Preview event page{/if}</a
						>
					{/snippet}
				</DropdownMenu.Item>
			</DropdownMenu.Group>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</ButtonGroup.Root>

<ResponsiveModal title="Share Event" bind:open={openShareModal}>
	<EventShareModal eventId={event.id} />
</ResponsiveModal>
