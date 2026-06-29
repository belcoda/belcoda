<script lang="ts">
	const metrics = [
		{ label: 'Upcoming events', value: '8', sub: 'Next: Jul 2' },
		{ label: 'Event signups', value: '342', sub: '+28 this week' },
		{ label: 'Community size', value: '1,847', sub: '+12 this week' },
		{ label: 'Active petitions', value: '3', sub: '2,104 signatures' }
	];
</script>

<section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
	{#each metrics as m}
		<div class="rounded-md bg-muted p-3">
			<p class="text-xs text-muted-foreground">{m.label}</p>
			<p class="mt-1 text-2xl font-medium">{m.value}</p>
			<p class="mt-0.5 text-xs text-muted-foreground">{m.sub}</p>
		</div>
	{/each}
</section>
