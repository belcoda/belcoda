<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import DesktopNavSidebar from '$lib/components/layouts/app/navigation/DesktopNavSidebar.svelte';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	const isMobile = new IsMobile();
	import { page } from '$app/state';
	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';
	import type { FlowListFilter } from '$lib/zero/query/flow/list';
	import { type ReadFlowResourceZero } from '$lib/schema/flow/flow';
	import { appState, getListFilter } from '$lib/state.svelte';
	import { PaginatedZeroList } from '$lib/state/paginated-zero-list.svelte';
	import { encodeFlowListCursor } from '$lib/utils/flow/cursor';
	import ErrorAlert from '$lib/components/alerts/Error.svelte';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import WorkflowIcon from '@lucide/svelte/icons/workflow';
	import { IsInViewport, watch } from 'runed';
	import { locale, t } from '$lib/index.svelte';
	import { formatNumber } from '$lib/utils/number';

	const pageSize = 25;

	let flowListFilter: FlowListFilter = $state({
		...getListFilter(appState.organizationId),
		status: null
	});

	const paginatedFlows = new PaginatedZeroList<FlowListFilter, ReadFlowResourceZero>({
		getBaseFilter: () => flowListFilter,
		encodeCursor: encodeFlowCursor,
		pageSize
	});
	let sentinel: HTMLElement | null = $state(null);
	const sentinelIsInViewport = $derived(new IsInViewport(() => sentinel));
	const flowList = $derived.by(() => z.createQuery(queries.flow.list(paginatedFlows.pageFilter)));

	watch(
		() => flowList.data,
		(data) => {
			paginatedFlows.handlePage(data);
		}
	);

	watch(
		() =>
			[sentinelIsInViewport.current, paginatedFlows.hasMore, paginatedFlows.items.length] as const,
		([isInViewport, hasMore]) => {
			if (isInViewport && hasMore) {
				paginatedFlows.loadMore();
			}
		}
	);

	function encodeFlowCursor(flow: ReadFlowResourceZero) {
		return encodeFlowListCursor({ createdAt: flow.createdAt, id: flow.id });
	}
</script>

<Sidebar.Root
	collapsible={!isMobile.current ? 'icon' : 'none'}
	class="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
>
	{#if !isMobile.current}
		<DesktopNavSidebar />
	{/if}
	<Sidebar.Root collapsible="none" class="flex w-full min-w-0 flex-1">
		<Sidebar.Header class="gap-3.5 border-b p-4">
			<div class="flex w-full items-center justify-between">
				<div class="text-2xl font-bold text-foreground">{t`Flows`}</div>
				<Button variant="outline" size="icon" href="/flow/new" title={t`New flow`}>
					<PlusIcon class="size-5" />
				</Button>
			</div>
		</Sidebar.Header>
		<Sidebar.Content>
			<Sidebar.Group class="p-0">
				<Sidebar.GroupContent class="p-0">
					{#if flowList.details.type === 'error'}
						<div class="px-2"><ErrorAlert>{t`Error loading flows`}</ErrorAlert></div>
					{/if}
					{#each paginatedFlows.items as flow (flow.id)}
						{@render flowItem(flow)}
					{/each}
					{#if flowList.details.type === 'complete' && paginatedFlows.items.length === 0}
						<Empty.Root>
							<Empty.Header>
								<Empty.Media variant="icon"><WorkflowIcon /></Empty.Media>
								<Empty.Title>{t`No flows yet`}</Empty.Title>
								<Empty.Description>
									{t`Create a flow to automate messages and actions for your community.`}
								</Empty.Description>
								<Empty.Content>
									<Button href="/flow/new">{t`New flow`}</Button>
								</Empty.Content>
							</Empty.Header>
						</Empty.Root>
					{/if}
				</Sidebar.GroupContent>
			</Sidebar.Group>
			{#if paginatedFlows.items.length > 0}
				<div class="border-t p-2">
					<div class="mb-2 text-center text-xs text-muted-foreground">
						{t`${formatNumber(paginatedFlows.items.length, locale.current)} shown`}
					</div>
					{#if paginatedFlows.hasMore}
						<div bind:this={sentinel} class="h-1" data-testid="flow-scroll-sentinel"></div>
					{/if}
				</div>
			{/if}
		</Sidebar.Content>
	</Sidebar.Root>
</Sidebar.Root>

{#snippet flowItem(flow: ReadFlowResourceZero)}
	<a
		data-testid="flow-list-link"
		data-flow-id={flow.id}
		href={`/flow/${flow.id}`}
		class:bg-sidebar-accent={page.url.pathname.startsWith(`/flow/${flow.id}`)}
		class:text-sidebar-accent-foreground={page.url.pathname.startsWith(`/flow/${flow.id}`)}
		class="flex w-full flex-col gap-0.5 border-b px-3 py-3 last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
	>
		<div class="truncate text-sm font-medium">{flow.name}</div>
		{#if flow.description}
			<div class="truncate text-xs text-muted-foreground">{flow.description}</div>
		{/if}
	</a>
{/snippet}
