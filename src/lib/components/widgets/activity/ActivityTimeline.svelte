<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { t } from '$lib/index.svelte';
	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';
	import ActivityRenderer from './ActivityRenderer.svelte';
	import { watch } from 'runed';
	import type { ReadActivityZero } from '$lib/schema/activity';
	import type { ListActivityInput } from '$lib/zero/query/activity/list';
	import { PaginatedZeroList } from '$lib/state/paginated-zero-list.svelte';
	import { encodeActivityListCursor } from '$lib/utils/activity/cursor';
	import AccountSelector from './AccountSelector.svelte';

	let selectedAccountId: string = $state('all');

	type ActivityListBaseFilter = Omit<ListActivityInput, 'cursor' | 'pageSize'>;

	type Props = {
		personId: string;
	};

	const { personId }: Props = $props();

	const pageSize = 20;
	const loadMoreScrollThreshold = 200;
	const scrollRestoreDurationMs = 1000;

	let scrollContainer: HTMLElement | null = $state(null);
	let listContent: HTMLElement | null = $state(null);
	let previousItemCount = 0;
	let pendingScrollRestore = false;
	let restoreAnchorId: string | null = null;
	let restoreAnchorOffset = 0;
	let scrollRestoreTimeout: ReturnType<typeof setTimeout> | null = null;
	let resizeObserver: ResizeObserver | undefined;

	//the filter schema wants undefined values instead of 'all'
	const selectedAccountIdForFilter = $derived(
		selectedAccountId === 'all' ? undefined : selectedAccountId
	);
	const paginatedActivities = new PaginatedZeroList<ActivityListBaseFilter, ReadActivityZero>({
		getBaseFilter: () => ({ personId, accountId: selectedAccountIdForFilter }),
		encodeCursor: encodeActivityCursor,
		pageSize
	});
	const activityQuery = $derived.by(() =>
		z.createQuery(queries.activity.list(paginatedActivities.pageFilter))
	);
	const chronologicalActivities = $derived([...paginatedActivities.items].reverse());

	onMount(() => {
		resizeObserver = new ResizeObserver(() => {
			if (pendingScrollRestore) {
				maintainScrollPosition();
			} else {
				loadMoreIfNotScrollable();
			}
		});
		if (listContent) {
			resizeObserver.observe(listContent);
		}
		return () => {
			resizeObserver?.disconnect();
			if (scrollRestoreTimeout) {
				clearTimeout(scrollRestoreTimeout);
			}
		};
	});

	watch(
		() => listContent,
		(content, previousContent) => {
			if (!resizeObserver) return;
			if (previousContent) {
				resizeObserver.unobserve(previousContent);
			}
			if (content) {
				resizeObserver.observe(content);
			}
		}
	);

	watch(
		() => personId,
		() => {
			endScrollRestore();
			previousItemCount = 0;
			paginatedActivities.reset();
		}
	);
	watch(
		() => activityQuery.data,
		(data) => {
			paginatedActivities.handlePage(data);
		}
	);
	watch(
		() => paginatedActivities.items.length,
		(itemCount) => {
			if (!scrollContainer || itemCount === 0) {
				previousItemCount = itemCount;
				return;
			}

			void tick().then(() => {
				if (!scrollContainer) return;

				if (previousItemCount === 0 || (itemCount > previousItemCount && !pendingScrollRestore)) {
					scrollToBottom();
				} else if (itemCount > previousItemCount && pendingScrollRestore) {
					maintainScrollPosition();
				}

				loadMoreIfNotScrollable();
				previousItemCount = itemCount;
			});
		}
	);

	function getAnchorElement(activityId: string) {
		return scrollContainer?.querySelector(`[data-activity-id="${activityId}"]`);
	}

	function maintainScrollPosition() {
		if (!scrollContainer || !restoreAnchorId) return;

		const anchorEl = getAnchorElement(restoreAnchorId);
		if (!anchorEl) return;

		const currentOffset =
			anchorEl.getBoundingClientRect().top - scrollContainer.getBoundingClientRect().top;
		const diff = currentOffset - restoreAnchorOffset;
		if (Math.abs(diff) > 0.5) {
			scrollContainer.scrollTop += diff;
		}
	}

	function startScrollRestore(anchorId: string) {
		if (!scrollContainer) return;

		const anchorEl = getAnchorElement(anchorId);
		if (!anchorEl) return;

		pendingScrollRestore = true;
		restoreAnchorId = anchorId;
		restoreAnchorOffset =
			anchorEl.getBoundingClientRect().top - scrollContainer.getBoundingClientRect().top;

		if (scrollRestoreTimeout) {
			clearTimeout(scrollRestoreTimeout);
		}
		scrollRestoreTimeout = setTimeout(endScrollRestore, scrollRestoreDurationMs);
	}

	function endScrollRestore() {
		pendingScrollRestore = false;
		restoreAnchorId = null;
		if (scrollRestoreTimeout) {
			clearTimeout(scrollRestoreTimeout);
			scrollRestoreTimeout = null;
		}
	}

	function scrollToBottom() {
		if (!scrollContainer) return;
		scrollContainer.scrollTop = scrollContainer.scrollHeight;
	}

	function canScrollTimeline() {
		if (!scrollContainer) return true;
		return scrollContainer.scrollHeight > scrollContainer.clientHeight + 1;
	}

	function loadMoreOlder(restoreScroll: boolean) {
		if (!paginatedActivities.hasMore || paginatedActivities.loadingMore) {
			return;
		}

		if (restoreScroll) {
			const anchorId = chronologicalActivities[0]?.id;
			if (anchorId) {
				startScrollRestore(anchorId);
			}
		}

		paginatedActivities.loadMore();
	}

	function loadMoreIfNotScrollable() {
		if (!scrollContainer || pendingScrollRestore) return;
		if (!paginatedActivities.hasMore || paginatedActivities.loadingMore) return;
		if (!canScrollTimeline()) {
			loadMoreOlder(false);
		}
	}

	function handleScroll() {
		if (!scrollContainer || !paginatedActivities.hasMore || paginatedActivities.loadingMore) {
			return;
		}
		if (scrollContainer.scrollTop < loadMoreScrollThreshold) {
			loadMoreOlder(true);
		}
	}

	function encodeActivityCursor(activity: ReadActivityZero) {
		return encodeActivityListCursor({
			createdAt: activity.createdAt,
			id: activity.id
		});
	}
</script>

<AccountSelector bind:selectedAccountId />

<div class="flex min-h-0 flex-1 flex-col bg-gray-50">
	<div
		bind:this={scrollContainer}
		class="activity-timeline flex-1 overflow-y-auto p-4"
		data-testid="activity-timeline-scroll"
		onscroll={handleScroll}
	>
		{#if chronologicalActivities.length > 0}
			<div bind:this={listContent} class="flex flex-col gap-y-4">
				{#each chronologicalActivities as activity (activity.id)}
					<div data-activity-id={activity.id}>
						<ActivityRenderer {activity} />
					</div>
				{/each}
			</div>
		{:else if activityQuery.data}
			<div class="text-center text-sm text-gray-400">{t`No activities yet`}</div>
		{:else}
			<div class="text-center text-sm text-gray-400">{t`Loading activities...`}</div>
		{/if}
	</div>
</div>

<style>
	.activity-timeline {
		background-color: #f9fafb;
		background-repeat: repeat;
		overflow-anchor: none;
		/* Taken from: https://heropatterns.com/ CC by 4.0 */
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 40' width='80' height='40'%3E%3Cpath fill='%23e7e7e7' fill-opacity='0.22' d='M0 40a19.96 19.96 0 0 1 5.9-14.11 20.17 20.17 0 0 1 19.44-5.2A20 20 0 0 1 20.2 40H0zM65.32.75A20.02 20.02 0 0 1 40.8 25.26 20.02 20.02 0 0 1 65.32.76zM.07 0h20.1l-.08.07A20.02 20.02 0 0 1 .75 5.25 20.08 20.08 0 0 1 .07 0zm1.94 40h2.53l4.26-4.24v-9.78A17.96 17.96 0 0 0 2 40zm5.38 0h9.8a17.98 17.98 0 0 0 6.67-16.42L7.4 40zm3.43-15.42v9.17l11.62-11.59c-3.97-.5-8.08.3-11.62 2.42zm32.86-.78A18 18 0 0 0 63.85 3.63L43.68 23.8zm7.2-19.17v9.15L62.43 2.22c-3.96-.5-8.05.3-11.57 2.4zm-3.49 2.72c-4.1 4.1-5.81 9.69-5.13 15.03l6.61-6.6V6.02c-.51.41-1 .85-1.48 1.33zM17.18 0H7.42L3.64 3.78A18 18 0 0 0 17.18 0zM2.08 0c-.01.8.04 1.58.14 2.37L4.59 0H2.07z'%3E%3C/path%3E%3C/svg%3E");
	}
</style>
