<script lang="ts">
	const { tagId, onRemove }: { tagId: string; onRemove: () => void } = $props();

	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';
	const tag = $derived.by(() => z.createQuery(queries.tag.read({ tagId })));
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
