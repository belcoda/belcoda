<script lang="ts">
	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';
	import ActivityRenderer from './ActivityRenderer.svelte';
	import { IsInViewport, watch } from 'runed';

	type Props = {
		personId: string;
	};

	const { personId }: Props = $props();

	let limit = $state(20);
	let sentinel: HTMLElement | null = $state(null);

	const activityQuery = $derived.by(() => {
		return z.createQuery(queries.activity.list({ personId, limit }));
	});

	const sentinelIsInViewport = $derived(new IsInViewport(() => sentinel));

	watch(
		() => sentinelIsInViewport.current,
		(isInViewport) => {
			if (isInViewport && activityQuery.data) {
				limit += 20;
			}
		}
	);
</script>

<div class="space-y-4">
	{#if activityQuery.data}
		{#each activityQuery.data as activity (activity.id)}
			<ActivityRenderer {activity} />
		{/each}
	{/if}

	<!-- Sentinel for infinite scroll -->
	<div bind:this={sentinel} class="h-4"></div>
</div>
