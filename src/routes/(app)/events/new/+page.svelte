<script lang="ts">
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import EventCreateOrUpdate from '$lib/components/forms/event/EventCreateOrUpdate.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
</script>

<ContentLayout rootLink="/events" {header} {footer}>
	<EventCreateOrUpdate />
</ContentLayout>

{#snippet header()}
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">New event</h1>
	</div>
{/snippet}

{#snippet footer()}
	<div class="flex w-full justify-end gap-2">
		<Button variant="outline">Cancel</Button>
		<Button>Save</Button>
	</div>
{/snippet}
