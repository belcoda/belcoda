<script lang="ts">
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	const { children } = $props();
</script>

<ContentLayout rootLink='/communications/email'>
	{@render children?.()}
</ContentLayout>