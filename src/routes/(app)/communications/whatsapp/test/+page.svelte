<script lang="ts">
	import TestFlow from '$lib/components/flow/test/TestFlow.svelte';
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
</script>

<ContentLayout rootLink="/communications">
	{#snippet header()}
		<h2 class="text-2xl font-bold">Local Organizers Mixer</h2>
	{/snippet}
	{#snippet footer()}
		<div class="flex w-full justify-end gap-2">
			<Button variant="outline">Cancel</Button>
			<Button variant="default">Send</Button>
		</div>
	{/snippet}
	<TestFlow />
</ContentLayout>
