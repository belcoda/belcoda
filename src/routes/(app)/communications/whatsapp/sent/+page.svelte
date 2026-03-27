<script lang="ts">
	import { t } from '$lib/index.svelte';
</script>

<div class="flex h-full items-center justify-center p-8">
	<div class="text-center">
		<h2 class="text-2xl font-semibold">{t`No sent message selected`}</h2>
		<p class="mt-2 text-muted-foreground">
			{t`Select a sent message from the list to view its details`}
		</p>
	</div>
</div>
