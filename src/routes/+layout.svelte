<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/logo.png';
	import { loadLocale } from 'wuchale/load-utils';
	import '../locales/main.loader.svelte.js';
	import '../locales/js.loader.js';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { locale } from '$lib/index.svelte';
	import { Tooltip as TooltipPrimitive } from 'bits-ui';
	import { cookieConsent } from '$lib/state/cookieConsent.svelte.js';
	import CookieBanner from '$lib/components/widgets/CookieBanner.svelte';
	import { beforeNavigate } from '$app/navigation';
	import { updated } from '$app/state';
	import { browser } from '$app/environment';
	import { clearDeploymentReloadFlag } from '$lib/utils/deployment-recovery';

	const { data, children } = $props();
	/* svelte-ignore state_referenced_locally */
	locale.setLocale(data.locale);

	function loadLocaleReady(currentLocale: typeof locale.current) {
		return loadLocale(currentLocale).then(() => {
			if (browser) {
				clearDeploymentReloadFlag();
			}
		});
	}

	beforeNavigate(({ to, willUnload }) => {
		if (updated.current && !willUnload && to?.url) {
			location.href = to.url.href;
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Belcoda</title>
	{#if cookieConsent.accepted}
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
	{/if}
</svelte:head>

<main
	class="[&::-webkit-scrollbar]:width-[6px] overflow-y-auto [&::-webkit-scrollbar-thumb]:rounded-[3px] [&::-webkit-scrollbar-thumb]:bg-gray-200"
>
	{#await loadLocaleReady(locale.current)}
		<!-- TODO: Replace with skeleton loader-->
		<div class="flex h-screen w-screen items-center justify-center">
			<span class="icon-[lucide--loader] size-10 animate-spin"></span>
		</div>
	{:then}
		<TooltipPrimitive.Provider>
			<Toaster position="top-center" />
			{@render children?.()}
			<CookieBanner />
		</TooltipPrimitive.Provider>
	{/await}
</main>
