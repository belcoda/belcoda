<script lang="ts">
	import { type EventListFilter } from '$lib/zero/query/event/list';
	const { status, onRemove }: { status: EventListFilter['status']; onRemove: () => void } =
		$props();

	import DismissableAvatarBadge from '$lib/components/ui/custom-badge/dismissable-avatar-badge.svelte';
	import { t } from '$lib/index.svelte';

	const text = $derived(() => {
		switch (status) {
			case 'draft':
				return t`Draft`;
			case 'published':
				return t`Published`;
			case 'cancelled':
				return t`Cancelled`;
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
	title={text() ?? t`Unknown event status filter`}
/>
