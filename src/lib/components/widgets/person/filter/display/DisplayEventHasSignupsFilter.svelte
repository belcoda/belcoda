<script lang="ts">
	const { onRemove }: { onRemove: () => void } = $props();

	import DismissableAvatarBadge from '$lib/components/ui/custom-badge/dismissable-avatar-badge.svelte';
</script>

<DismissableAvatarBadge
	color="gray"
	hideAvatar={true}
	src={null}
	onRemove={() => onRemove()}
	title="Has signups"
/>
