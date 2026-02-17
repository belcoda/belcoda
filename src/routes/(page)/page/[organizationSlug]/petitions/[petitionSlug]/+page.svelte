<script lang="ts">
	import RenderPetitionPage from '$lib/components/layouts/public/petition/RenderPetitionPage.svelte';

	const { data, form } = $props();
</script>

<RenderPetitionPage {data} {form} />
