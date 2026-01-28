<script lang="ts">
	import UniversalLayout from '$lib/components/layouts/app/UniversalLayout.svelte';
	const { children } = $props();
</script>

<UniversalLayout rootNav="/communications/email">
	{@render children?.()}
</UniversalLayout>