<script lang="ts">
	import { t } from '$lib/index.svelte';
	import { page } from '$app/stores';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
</script>

<div class="flex min-h-screen items-center justify-center bg-background p-4">
	<Card.Root class="w-full max-w-md">
		<Card.Header class="text-center">
			<div class="mb-4 flex justify-center">
				<AlertCircleIcon class="size-12 text-destructive" />
			</div>
			<Card.Title class="text-2xl">{t`Petition Not Found`}</Card.Title>
			<Card.Description>
				{$page.error?.message || t`The petition you are looking for could not be found.`}
			</Card.Description>
		</Card.Header>
		<Card.Content class="flex justify-center">
			<Button href="/">{t`Return to Home`}</Button>
		</Card.Content>
	</Card.Root>
</div>
