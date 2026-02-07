<script lang="ts">
	const { tagId, onRemove }: { tagId: string; onRemove: () => void } = $props();

	import { readTag } from '$lib/zero/query/tag/read';
	import { z } from '$lib/zero.svelte';
	import { getAppState } from '$lib/state.svelte';
	const appState = getAppState();
	const tag = $derived.by(() => z.createQuery(readTag(appState.queryContext, { tagId })));
	import DismissableAvatarBadge from '$lib/components/ui/custom-badge/dismissable-avatar-badge.svelte';
</script>

{#if tag.data}
	<DismissableAvatarBadge
		color="yellow"
		avatarTitle={'#'}
		src={null}
		onRemove={() => onRemove()}
		title={tag.data?.name}
	/>
{/if}
