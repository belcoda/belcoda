<script lang="ts">
	const { onRemove }: { onRemove: () => void } = $props();

	import DismissableAvatarBadge from '$lib/components/ui/custom-badge/dismissable-avatar-badge.svelte';
	import { t } from '$lib/index.svelte';
</script>

<DismissableAvatarBadge
	color="gray"
	hideAvatar={true}
	src={null}
	onRemove={() => onRemove()}
	title={t`Archived`}
/>
