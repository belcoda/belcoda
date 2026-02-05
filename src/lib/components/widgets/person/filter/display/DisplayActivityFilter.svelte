<script lang="ts">
	import { type ListPersonsInput } from '$lib/zero/query/person/list';
	const {
		mostRecentActivity,
		onRemove
	}: { mostRecentActivity: ListPersonsInput['mostRecentActivity']; onRemove: () => void } =
		$props();

	import DismissableAvatarBadge from '$lib/components/ui/custom-badge/dismissable-avatar-badge.svelte';

	const text = $derived(() => {
		switch (mostRecentActivity) {
			case '7days':
				return 'Recent activity: 7 days';
			case '30days':
				return 'Recent activity: 30 days';
			case '90days':
				return 'Recent activity: 90 days';
			case '1year':
				return 'Recent activity: 1 year';
			case 'noactivity7days':
				return 'No activity: 7 days';
			case 'noactivity30days':
				return 'No activity: 30 days';
			case 'noactivity90days':
				return 'No activity: 90 days';
			case 'noactivity1year':
				return 'No activity: 1 year';
		}
	});
	const avatarTitle = $derived(() => {
		switch (mostRecentActivity) {
			case '7days':
				return '7';
			case '30days':
				return '30';
			case '90days':
				return '90';
			case '1year':
				return '1y';
			case 'noactivity7days':
				return '7';
			case 'noactivity30days':
				return '30';
			case 'noactivity90days':
				return '90';
			case 'noactivity1year':
				return '1y';
		}
	});
</script>

<DismissableAvatarBadge
	color="gray"
	hideAvatar={true}
	src={null}
	avatarTitle={avatarTitle() ?? '?'}
	onRemove={() => onRemove()}
	title={text() ?? t`Unknown activity filter`}
/>
