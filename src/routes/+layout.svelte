<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/logo.png';
	import { loadLocale } from 'wuchale/load-utils';
	import '../locales/main.loader.svelte.js';
	import '../locales/js.loader.js';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { locale } from '$lib/index.svelte';
	const { data, children } = $props();
	/* svelte-ignore state_referenced_locally */
	locale.setLocale(data.locale);
	import { Tooltip as TooltipPrimitive } from 'bits-ui';
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Belcoda</title>
	<!-- Google tag (gtag.js) -->
	<script async src="https://www.googletagmanager.com/gtag/js?id=AW-17963790839"></script>
	<script>
		window.dataLayer = window.dataLayer || [];
		function gtag() {
			dataLayer.push(arguments);
		}
		gtag('js', new Date());

		gtag('config', 'AW-17963790839');
	</script>
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
