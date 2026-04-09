<script lang="ts">
	import RenderPetitionPage from '$lib/components/layouts/public/petition/RenderPetitionPage.svelte';
	import UserNavBar from '$lib/components/layouts/public/UserNavBar.svelte';
	import { page } from '$app/state';
	import { env } from '$env/dynamic/public';
	import { dev } from '$app/environment';
	import { t } from '$lib/index.svelte';

	const { data, form } = $props();

	const paramLayout = page.url.searchParams.get('layout') || 'default';
	const layouts = ['default', 'embed'];
	const layout = layouts.includes(paramLayout) ? (paramLayout as 'default' | 'embed') : 'default';

	const editPetitionUrl = $derived.by(
		() => `${dev ? 'http' : 'https'}://${env.PUBLIC_ROOT_DOMAIN}/petitions/${data.petition.id}/edit`
	);
</script>

{#if data.isAdmin}
	<UserNavBar session={data.session} linkUrl={editPetitionUrl} linkText={t`Edit Petition`} />
{/if}

<RenderPetitionPage {data} form={form?.form || data.form} {layout} />
