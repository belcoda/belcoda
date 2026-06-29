<script lang="ts">
	import MobileBottomNav from '$lib/components/layouts/app/navigation/MobileBottomNav.svelte';
	import MobileTopNav from '$lib/components/layouts/app/navigation/MobileTopNav.svelte';
	import DesktopNavSidebar from '$lib/components/layouts/app/navigation/DesktopNavSidebar.svelte';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';

	const isMobile = new IsMobile();
	const { children } = $props();
</script>

<Sidebar.Provider
	style={isMobile.current ? '--sidebar-width: 100%;' : '--sidebar-width: 75px;'}
	class={isMobile.current ? 'max-h-full min-h-0' : ''}
>
	{#if isMobile.current}
		<div class="relative flex h-screen w-full flex-col overflow-hidden">
			<header class="flex h-[60px] w-full shrink-0">
				<MobileTopNav />
			</header>
			<main class="min-h-0 flex-1 overflow-y-auto">
				{@render children?.()}
			</main>
			<footer class="sticky bottom-0 flex h-[75px] w-full shrink-0">
				<MobileBottomNav />
			</footer>
		</div>
	{:else}
		<div class="flex h-screen w-full overflow-hidden">
			<DesktopNavSidebar />
			<main class="min-w-0 flex-1 overflow-y-auto">
				{@render children?.()}
			</main>
		</div>
	{/if}
</Sidebar.Provider>
