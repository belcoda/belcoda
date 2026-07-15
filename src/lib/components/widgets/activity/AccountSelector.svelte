<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs';

	let { selectedAccountId = $bindable() }: { selectedAccountId: string } = $props();
</script>

<Tabs.Root class="w-full" bind:value={selectedAccountId}>
	<Tabs.List class="w-full border-b rounded-none">
		<Tabs.Trigger value="all">Activity</Tabs.Trigger>
		<Tabs.Trigger value="comments">Comments</Tabs.Trigger>
	</Tabs.List>
</Tabs.Root>
