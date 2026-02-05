<script lang="ts">
	import { type EventListFilter } from '$lib/zero/query/event/list';
	const { eventType, onRemove }: { eventType: EventListFilter['eventType']; onRemove: () => void } =
		$props();

	import DismissableAvatarBadge from '$lib/components/ui/custom-badge/dismissable-avatar-badge.svelte';
	import { t } from '$lib/index.svelte';

	const text = $derived(() => {
		switch (eventType) {
			case 'online':
				return t`Online`;
			case 'in-person':
				return t`In-person`;
		}
	});
	const avatarTitle = $derived(() => {
		switch (eventType) {
			case 'online':
				return 'O';
			case 'in-person':
				return 'I';
		}
	});
</script>

<DismissableAvatarBadge
	color="gray"
	hideAvatar={true}
	src={null}
	avatarTitle={avatarTitle() ?? '?'}
	onRemove={() => onRemove()}
	title={text() ?? t`Unknown event type filter`}
/>
