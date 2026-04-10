<script lang="ts">
	import { t } from '$lib/index.svelte';
	import { page } from '$app/state';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
	import { dev } from '$app/environment';
	function retry() {
		window.location.reload();
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-background p-4">
	<Card.Root class="w-full max-w-md">
		<Card.Header class="text-center">
			<div class="mb-4 flex justify-center">
				<AlertCircleIcon class="size-12 text-destructive" />
			</div>
			<Card.Title class="text-2xl">{page.status}</Card.Title>
			<Card.Description class="text-left">
				{page.error?.message ?? t`Something went wrong.`}
				{#if page.error?.errorId}
					<span class="mt-2 block text-xs text-muted-foreground">
						{t`Reference`}: {page.error.errorId}
					</span>
				{/if}
			</Card.Description>
		</Card.Header>
		{#if dev && page.error && 'debug' in page.error && page.error.debug}
			<Card.Content>
				<details class="rounded-md border bg-muted/40 p-3 text-left text-xs">
					<summary class="cursor-pointer font-medium">{t`Debug details`}</summary>
					<pre
						class="mt-2 max-h-48 overflow-auto font-mono wrap-break-word whitespace-pre-wrap text-muted-foreground">{page
							.error.debug}</pre>
				</details>
			</Card.Content>
		{/if}
		<Card.Footer class="flex flex-wrap justify-center gap-2">
			<Button variant="outline" type="button" onclick={retry}>{t`Try again`}</Button>
			<Button href="/">{t`Home`}</Button>
		</Card.Footer>
	</Card.Root>
</div>
