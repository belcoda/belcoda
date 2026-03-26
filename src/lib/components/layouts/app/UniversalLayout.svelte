<script lang="ts">
	//side bar layout
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	const isMobile = new IsMobile();
	import type { Snippet } from 'svelte';

	let {
		rootNav,
		sidebar,
		children
	}: { rootNav: `/${string}`; sidebar: Snippet; children: Snippet } = $props();

	import { page } from '$app/state';
	const isRoot = $derived(page.url.pathname === rootNav);
	import MobileTopNav from '$lib/components/layouts/app/navigation/MobileTopNav.svelte';
	import MobileBottomNav from '$lib/components/layouts/app/navigation/MobileBottomNav.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
</script>

<Sidebar.Provider
	style={isMobile.current
		? '--sidebar-width: 100%;'
		: page.url.pathname.startsWith('/communications')
			? '--sidebar-width: 550px;'
			: '--sidebar-width: 450px;'}
>
	{#if isMobile.current}
		<!-- mobile layout -->
		{#if isRoot}
			<div class="relative flex h-screen w-full flex-col overflow-hidden">
				<header class="flex h-[60px] w-full shrink-0">
					<MobileTopNav />
				</header>
				<div class="flex h-[calc(100vh-135px)] w-full flex-1">
					<div class="w-full">{@render sidebar?.()}</div>
				</div>
				<footer class="sticky bottom-0 flex h-[75px] w-full shrink-0">
					<MobileBottomNav />
				</footer>
			</div>
		{:else}
			<div class="relative flex h-screen w-full flex-col overflow-hidden">
				{@render children?.()}
			</div>
		{/if}
	{:else}
		<!-- desktop layout -->

		{@render sidebar?.()}
		<main class="w-full">
			{@render children?.()}
		</main>
	{/if}
</Sidebar.Provider>
