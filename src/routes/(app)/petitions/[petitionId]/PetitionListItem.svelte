<script lang="ts">
	import { t } from '$lib/index.svelte';
	import Avatar from '$lib/components/widgets/avatar/Avatar.svelte';
	import ColorBadge from '$lib/components/ui/colorbadge/badge.svelte';
	import type { ReadPetitionZero } from '$lib/schema/petition/petition';
	let { petition }: { petition: ReadPetitionZero } = $props();
</script>

<div class="flex w-full items-center justify-start gap-3">
	<div class="w-12">
		<Avatar
			src={petition.featureImage}
			name1={petition.title}
			class="size-12 rounded-lg"
			imageClass="rounded-lg object-cover"
		/>
	</div>
	<div>
		<div class="flex items-center gap-2">
			<div class="text-lg font-medium" data-testid="petition-title-display">{petition.title}</div>
			<ColorBadge color={petition.published ? 'green' : 'gray'}>
				{petition.published ? t`Published` : t`Draft`}
			</ColorBadge>
		</div>
		{#if petition.petitionTarget}
			<div class="text-sm text-muted-foreground">
				{t`Target:`}
				{petition.petitionTarget}
			</div>
		{/if}
	</div>
</div>
