<script lang="ts">
	import { type EventListFilter } from '$lib/zero/query/event/list';
	const { status, onRemove }: { status: EventListFilter['status']; onRemove: () => void } =
		$props();

	import DismissableAvatarBadge from '$lib/components/ui/custom-badge/dismissable-avatar-badge.svelte';

	const text = $derived(() => {
		switch (status) {
			case 'draft':
				return 'Draft';
			case 'published':
				return 'Published';
			case 'cancelled':
				return 'Cancelled';
		}
	});
	const avatarTitle = $derived(() => {
		switch (status) {
			case 'draft':
				return 'D';
			case 'published':
				return 'P';
			case 'cancelled':
				return 'C';
		}
	});
</script>

<DismissableAvatarBadge
	color="gray"
	hideAvatar={true}
	src={null}
	avatarTitle={avatarTitle() ?? '?'}
	onRemove={() => onRemove()}
	title={text() ?? 'Unknown event status filter'}
/>
