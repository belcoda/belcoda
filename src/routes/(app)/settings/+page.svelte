<script lang="ts">
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
</script>

<ContentLayout rootLink="/settings" {header} {footer}>sws</ContentLayout>

{#snippet header()}
	<div class="flex items-center justify-between">
		<h1>Test</h1>
		<Button variant="outline"><EllipsisIcon class="size-5" /></Button>
	</div>
{/snippet}

{#snippet footer()}
	<p>Footer</p>
{/snippet}
