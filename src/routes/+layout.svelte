<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/logo.png';
	import { loadLocale } from 'wuchale/load-utils';
	import '../locales/main.loader.svelte.js';
	import '../locales/js.loader.js';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { locale } from '$lib/index.svelte';
	import { Tooltip as TooltipPrimitive } from 'bits-ui';
	import { beforeNavigate } from '$app/navigation';
	import { updated } from '$app/state';
	import { dev } from '$app/environment';

	const { data, children } = $props();
	/* svelte-ignore state_referenced_locally */
	locale.setLocale(data.locale);

	beforeNavigate(({ to, willUnload }) => {
		if (updated.current && !willUnload && to?.url) {
			location.href = to.url.href;
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Belcoda</title>
	{#if !dev}
		<script
			defer
			src="https://cloud.umami.is/script.js"
			data-website-id="5678fa17-8b31-4017-bcee-5c723cad11bc"
			data-exclude-search="true"
			data-performance="true"
			data-exclude-hash="true"
		></script>
	{/if}
</svelte:head>

<main
	class="[&::-webkit-scrollbar]:width-[6px] overflow-y-auto [&::-webkit-scrollbar-thumb]:rounded-[3px] [&::-webkit-scrollbar-thumb]:bg-gray-200"
>
	{#await loadLocale(locale.current)}
		<!-- TODO: Replace with skeleton loader-->
		<div class="flex h-screen w-screen items-center justify-center">
			<span class="icon-[lucide--loader] size-10 animate-spin"></span>
		</div>
	{:then}
		<TooltipPrimitive.Provider>
			<Toaster position="top-center" />
			{@render children?.()}
		</TooltipPrimitive.Provider>
	{/await}
</main>
