<script lang="ts">
	import TestFlow from '$lib/components/flow/test/TestFlow.svelte';
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
</script>

<ContentLayout rootLink="/communications">
	{#snippet header()}
		<h1>Test Flow</h1>
	{/snippet}
	{#snippet footer()}
		<p>Footer</p>
	{/snippet}
	<TestFlow />
</ContentLayout>
