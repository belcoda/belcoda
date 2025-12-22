<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/logo.png';
	import { loadLocale } from 'wuchale/load-utils';
	import '../locales/main.loader.svelte.js';
	import { appState } from '$lib/state.svelte';
	import { Toaster } from '$lib/components/ui/sonner/index.js';

	const { data, children } = $props();
	appState.setLocale(data.locale);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Belcoda</title>
</svelte:head>

<main
	class="[&::-webkit-scrollbar]:width-[6px] overflow-y-auto [&::-webkit-scrollbar-thumb]:rounded-[3px] [&::-webkit-scrollbar-thumb]:bg-gray-200"
>
	{#await loadLocale(appState.locale)}
		<!-- TODO: Replace with skeleton loader-->
		<div class="flex h-screen w-screen items-center justify-center">
			<span class="icon-[lucide--loader] size-10 animate-spin"></span>
		</div>
	{:then}
		<Toaster position="top-center" />
		{@render children?.()}
	{/await}
</main>
