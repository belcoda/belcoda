<script lang="ts">
	import { type PetitionListFilter } from '$lib/zero/query/petition/list';
	const { status, onRemove }: { status: PetitionListFilter['status']; onRemove: () => void } =
		$props();

	import DismissableAvatarBadge from '$lib/components/ui/custom-badge/dismissable-avatar-badge.svelte';
	import { t } from '$lib/index.svelte';

	const text = $derived(() => {
		switch (status) {
			case 'draft':
				return t`Draft`;
			case 'published':
				return t`Published`;
			case 'archived':
				return t`Archived`;
		}
	});
	const avatarTitle = $derived(() => {
		switch (status) {
			case 'draft':
				return 'D';
			case 'published':
				return 'P';
			case 'archived':
				return 'A';
		}
	});
</script>

<DismissableAvatarBadge
	color="gray"
	hideAvatar={true}
	src={null}
	avatarTitle={avatarTitle() ?? '?'}
	onRemove={() => onRemove()}
	title={text() ?? t`Unknown petition status filter`}
/>
