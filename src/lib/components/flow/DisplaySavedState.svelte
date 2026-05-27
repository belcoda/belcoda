<script lang="ts">
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import CheckIcon from '@lucide/svelte/icons/check';
	import { beforeNavigate } from '$app/navigation';
	import { t } from '$lib/index.svelte';
	import { Panel } from '@xyflow/svelte';
	import { isLoading, isTainted, lastSavedAt } from '$lib/components/flow/flow_state.svelte';
	import { getTimeAgo } from '$lib/utils/time';
	import { locale } from '$lib/index.svelte';
	beforeNavigate((nav) => {
		if (!isTainted()) return;
		if (!window.confirm(t`Your changes might not be saved. Leave this page?`)) {
			nav.cancel();
		}
	});

	const derivedTimeAgoFormatter = $derived(getTimeAgo(locale.current));
	const derivedTimeAgo = $derived(t`Saved ${derivedTimeAgoFormatter.format(lastSavedAt())}`);
</script>

<Panel position="bottom-left">
	<div class="text-xs text-muted-foreground">
		{#if isLoading()}
			<div class="flex items-center gap-2">
				<Spinner />
				{t`Saving...`}
			</div>
		{:else}
			<div class="flex items-center gap-2">
				<CheckIcon class="size-3" strokeWidth={3} />
				{derivedTimeAgo}
			</div>
		{/if}
	</div>
</Panel>
