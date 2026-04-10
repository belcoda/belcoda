<script lang="ts">
	import RenderPetitionPage from '$lib/components/layouts/public/petition/RenderPetitionPage.svelte';
	import { page } from '$app/state';

	const { data } = $props();

	const paramLayout = page.url.searchParams.get('layout') || 'default';
	const layouts = ['default', 'embed'];
	const layout = layouts.includes(paramLayout) ? (paramLayout as 'default' | 'embed') : 'default';
</script>

<RenderPetitionPage {data} {layout} success={true} petitionId={data.petition.id} />
