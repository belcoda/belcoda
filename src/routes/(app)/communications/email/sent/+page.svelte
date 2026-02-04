<script lang="ts">
	import Send from '@lucide/svelte/icons/send';
	import { Button } from '$lib/components/ui/button';
</script>

<div class="flex h-full flex-col items-center justify-center p-8 text-center">
	<div class="flex max-w-[420px] flex-col items-center justify-center">
		<div class="flex size-20 items-center justify-center rounded-full bg-muted">
			<Send class="size-10 text-muted-foreground" />
		</div>
		<h2 class="mt-6 text-xl font-semibold">Select a sent email</h2>
		<p class="mt-2 text-center text-muted-foreground">
			Choose an email from the list to view its details and statistics.
		</p>
		<div class="mt-6">
			<Button href="/communications/email/drafts/new">
				Create New Email
			</Button>
		</div>
	</div>
</div>
